// Greenhouse.io content script
(async function() {
  console.log('Greenhouse content script loaded');
  
  // Import Supabase (simplified for content script)
  const SUPABASE_URL = 'https://cpqtcjrxvqzelagryfmv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcXRjanJ4dnF6ZWxhZ3J5Zm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg1MTUsImV4cCI6MjA3NzUzNDUxNX0.bXH2CpcN8hC5iprBESl968Vg7Hw5JReWnDOdd6vKSyc';
  
  // Utility functions
  function fillInput(element, value) {
    if (!element || value == null) return false;
    
    if (element.tagName === 'SELECT') {
      element.value = value;
    } else if (element.type === 'checkbox') {
      element.checked = value === true || value === 'true' || value === 'yes' || value === 'Yes';
    } else if (element.type === 'radio') {
      element.checked = element.value === value;
    } else {
      element.value = value;
    }
    
    // Trigger events for React forms
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    return true;
  }
  
  async function waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }
  
  // Load user data and templates
  async function loadUserData() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_templates`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to load templates');
      return await response.json();
    } catch (err) {
      console.error('loadUserData error:', err);
      return [];
    }
  }
  
  // Wait for form to be ready
  await waitForElement('form, input[type="text"], input[type="email"]');
  
  console.log('Form detected, starting autofill...');
  
  // Common Greenhouse selectors
  const selectors = {
    first_name: 'input[name="job_application[first_name]"], input[id*="first_name"]',
    last_name: 'input[name="job_application[last_name]"], input[id*="last_name"]',
    email: 'input[name="job_application[email]"], input[type="email"]',
    phone: 'input[name="job_application[phone]"], input[type="tel"]',
    resume: 'input[type="file"][name*="resume"]',
    cover_letter: 'input[type="file"][name*="cover"]',
    linkedin: 'input[name="job_application[location]"], input[id*="linkedin"]',
    website: 'input[name="job_application[website]"], input[id*="website"]',
    work_authorization: 'select[name*="work_authorization"], select[id*="authorization"]',
    require_sponsorship: 'select[name*="sponsorship"], select[id*="sponsorship"]'
  };
  
  // Example profile data (should come from Supabase)
  const profileData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    work_authorization: 'yes',
    require_sponsorship: 'no'
  };
  
  const missingQuestions = [];
  
  // Fill known fields
  for (const [key, selector] of Object.entries(selectors)) {
    const element = document.querySelector(selector);
    if (element && profileData[key]) {
      const filled = fillInput(element, profileData[key]);
      console.log(`Filled ${key}:`, filled);
    } else if (element && !profileData[key]) {
      // Found field but no answer
      const label = element.labels?.[0]?.textContent?.trim() || key;
      missingQuestions.push({
        question_key: key,
        question_text: label
      });
    }
  }
  
  // Handle custom questions
  const customQuestions = document.querySelectorAll('[data-question-id], .application-question');
  customQuestions.forEach(questionEl => {
    const label = questionEl.querySelector('label')?.textContent?.trim();
    const input = questionEl.querySelector('input, textarea, select');
    
    if (input && !input.value) {
      const questionKey = input.name || input.id || `custom_${Date.now()}`;
      missingQuestions.push({
        question_key: questionKey,
        question_text: label || questionKey
      });
    }
  });
  
  if (missingQuestions.length > 0) {
    console.log('Missing questions:', missingQuestions);
    chrome.runtime.sendMessage({
      type: 'missing-question',
      payload: {
        site: 'greenhouse',
        missing: missingQuestions,
        application_id: null // Should get from context
      }
    });
  } else {
    // All fields filled, try to submit
    console.log('All fields filled, looking for submit button...');
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button[id*="submit"]');
    
    if (submitButton) {
      console.log('Found submit button, clicking...');
      setTimeout(() => {
        submitButton.click();
        chrome.runtime.sendMessage({
          type: 'filled-result',
          payload: {
            application_id: null,
            status: 'submitted',
            message: 'Application submitted successfully'
          }
        });
      }, 1000);
    }
  }
  
  // Listen for answers from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'answers-provided') {
      console.log('Received answers, filling form...');
      msg.answers.forEach(answer => {
        // Find and fill the field
        const input = document.querySelector(`[name="${answer.question_key}"], #${answer.question_key}`);
        if (input) {
          fillInput(input, answer.answer_text);
        }
      });
      
      // Try submit again
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        setTimeout(() => submitButton.click(), 500);
      }
    }
  });
  
  console.log('Greenhouse script completed');
})();
