// Background Service Worker - Batch Processing with Concurrency Control
// Using direct fetch calls instead of Supabase client to avoid CSP issues

const SUPABASE_URL = 'https://cpqtcjrxvqzelagryfmv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcXRjanJ4dnF6ZWxhZ3J5Zm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg1MTUsImV4cCI6MjA3NzUzNDUxNX0.bXH2CpcN8hC5iprBESl968Vg7Hw5JReWnDOdd6vKSyc';

// Batch processing configuration
const DEFAULT_TOTAL = 100;
const CONCURRENCY = 5; // Process 5 tabs at a time

// Run state
let runState = { 
  queue: [], 
  total: 0, 
  processed: 0, 
  active: 0, 
  paused: false 
};

// Helper to make Supabase REST API calls
async function supabaseQuery(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Supabase query failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Track active application tabs
const activeTabs = new Map();

// Fetch queued applications
async function fetchQueued(limit = 5) {
  try {
    const data = await supabaseQuery(
      `applications?select=id,url,site,owner_uid&status=eq.queued&limit=${limit}`
    );
    return data ?? [];
  } catch (err) {
    console.error('fetchQueued error:', err);
    return [];
  }
}

// Detect site from URL
function detectSite(url) {
  if (/greenhouse\.io/i.test(url)) return 'greenhouse';
  if (/lever\.co/i.test(url)) return 'lever';
  if (/myworkdayjobs\.com/i.test(url)) return 'workday';
  return 'generic';
}

// Pick correct content script
function pickScript(site, url) {
  const detected = detectSite(url);
  const finalSite = site || detected;
  
  if (finalSite === 'greenhouse') return 'sites/greenhouse.js';
  if (finalSite === 'lever') return 'sites/lever.js';
  if (finalSite === 'workday') return 'sites/workday.js';
  return 'sites/generic.js';
}

// Start batch processing run
async function startRun(total) {
  console.log(`Starting batch run: ${total} jobs`);
  
  const jobs = await fetchQueued(total);
  if (jobs.length === 0) {
    console.log('No queued jobs found');
    notifyProgress();
    return { success: true, opened: 0, message: 'No jobs in queue' };
  }
  
  runState = { 
    queue: jobs, 
    total: jobs.length, 
    processed: 0, 
    active: 0, 
    paused: false 
  };
  
  notifyProgress();
  fillMore();
  
  return { success: true, opened: jobs.length, message: `Started processing ${jobs.length} jobs` };
}

// Notify popup of progress
function notifyProgress() {
  chrome.runtime.sendMessage({ 
    type: 'progress', 
    processed: runState.processed, 
    total: runState.total, 
    active: runState.active 
  }).catch(() => {});
}

// Process more jobs up to concurrency limit
function fillMore() {
  if (runState.paused) return;
  
  while (runState.active < CONCURRENCY && runState.queue.length > 0) {
    const app = runState.queue.shift();
    runState.active++;
    
    openAndFill(app).finally(() => {
      runState.active--;
      runState.processed++;
      notifyProgress();
      
      if (runState.queue.length > 0) {
        fillMore();
      } else if (runState.active === 0) {
        console.log('Batch processing complete');
      }
    });
  }
}

// Open a single job and fill it
async function openAndFill(app) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: app.url, active: false }, (tab) => {
      activeTabs.set(tab.id, { job: app, status: 'loading' });
      
      const onUpdated = (tabId, info) => {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          
          const script = pickScript(app.site, app.url);
          console.log(`Injecting ${script} into tab ${tabId}`);
          
          chrome.scripting.executeScript({
            target: { tabId },
            files: [script]
          }).then(async () => {
            // Mark as opened
            await supabaseQuery(`applications?id=eq.${app.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'opened' })
            });
            
            // Close tab after grace period (8 seconds for submission)
            setTimeout(() => {
              chrome.tabs.remove(tab.id, () => resolve());
            }, 8000);
          }).catch(err => {
            console.error('Script injection error:', err);
            updateApplicationStatus(app.id, 'failed', `Script injection failed: ${err.message}`);
            chrome.tabs.remove(tab.id, () => resolve());
          });
        }
      };
      
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}

// Update application status
async function updateApplicationStatus(applicationId, status, message = null) {
  try {
    await supabaseQuery(`applications?id=eq.${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    
    if (message) {
      await supabaseQuery('application_issues', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          owner_uid: null,
          url: '',
          issue_type: status === 'failed' ? 'error' : 'note',
          message
        })
      });
    }
  } catch (err) {
    console.error('updateApplicationStatus error:', err);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Background received message:', msg.type);
  
  if (msg.type === 'open-next') {
    startRun(msg.count || DEFAULT_TOTAL).then(result => {
      sendResponse(result);
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (msg.type === 'missing-question') {
    // Pause the run
    runState.paused = true;
    
    // Forward to popup for user input
    chrome.runtime.sendMessage({
      type: 'prompt-answer',
      payload: msg.payload
    }).catch(() => {
      // Popup might not be open, that's okay
      console.log('Popup not open, storing question for later');
    });
  }
  
  if (msg.type === 'filled-result') {
    const { application_id, status, message } = msg.payload;
    updateApplicationStatus(application_id, status, message).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (msg.type === 'save-answers') {
    saveAnswers(msg.payload.answers).then(() => {
      // Resume the run after saving
      runState.paused = false;
      fillMore();
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});

// Save multiple answers to database
async function saveAnswers(answers) {
  try {
    for (const answer of answers) {
      await supabaseQuery('qa_templates', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          owner_uid: null, // Will be set by RLS
          scope: 'private',
          site: '*',
          question_key: answer.question_key,
          question_text: answer.question_key,
          answer_text: answer.answer_text
        })
      });
    }
    return { success: true };
  } catch (err) {
    console.error('saveAnswers error:', err);
    return { success: false, error: err.message };
  }
}

// Save single answer to database
async function saveAnswer({ question_key, question_text, answer_text, site, application_id }) {
  try {
    // Upsert into qa_templates
    await supabaseQuery('qa_templates', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        owner_uid: null, // Will be set by RLS
        scope: 'private',
        site: site || '*',
        question_key,
        question_text,
        answer_text
      })
    });
    
    // Insert into application_answers
    if (application_id) {
      await supabaseQuery('application_answers', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          application_id,
          question_key,
          question_text,
          filled: true,
          answer_text
        })
      });
    }
    
    return { success: true };
  } catch (err) {
    console.error('saveAnswer error:', err);
    return { success: false, error: err.message };
  }
}

console.log('AutoApply Assistant background worker loaded');
