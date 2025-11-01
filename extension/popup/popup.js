// Popup UI logic
let currentQuestions = [];
let currentSite = '';
let currentApplicationId = null;

const elements = {
  openJobsBtn: document.getElementById('open-jobs-btn'),
  jobCount: document.getElementById('job-count'),
  status: document.getElementById('status'),
  progressSection: document.getElementById('progress-section'),
  progressText: document.getElementById('progress-text'),
  progressBar: document.getElementById('progress-bar'),
  promptSection: document.getElementById('prompt-section'),
  questionsContainer: document.getElementById('questions-container'),
  saveAnswersBtn: document.getElementById('save-answers-btn'),
  skipBtn: document.getElementById('skip-btn'),
  stats: document.getElementById('stats'),
  statOpened: document.getElementById('stat-opened'),
  statFilled: document.getElementById('stat-filled'),
  statSubmitted: document.getElementById('stat-submitted')
};

// Show status message
function showStatus(message, type = 'info') {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;
  elements.status.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      elements.status.style.display = 'none';
    }, 5000);
  }
}

// Open next N jobs
elements.openJobsBtn.addEventListener('click', async () => {
  const count = parseInt(elements.jobCount.value) || 5;
  
  elements.openJobsBtn.disabled = true;
  showStatus(`Opening ${count} jobs...`, 'info');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'open-next',
      count
    });
    
    if (response.success) {
      showStatus(response.message, 'success');
      elements.stats.classList.remove('hidden');
      elements.statOpened.textContent = response.opened;
    } else {
      showStatus(`Error: ${response.error}`, 'error');
    }
  } catch (err) {
    showStatus(`Error: ${err.message}`, 'error');
  } finally {
    elements.openJobsBtn.disabled = false;
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'progress') {
    updateProgress(msg);
  }
  
  if (msg.type === 'prompt-answer') {
    showPrompt(msg.payload);
  }
});

// Update progress display
function updateProgress({ processed, total, active }) {
  elements.progressSection.classList.remove('hidden');
  elements.progressText.textContent = `Processed ${processed}/${total} (${active} active)`;
  elements.progressBar.value = processed;
  elements.progressBar.max = total;
  
  if (processed === total && active === 0) {
    showStatus('Batch processing complete!', 'success');
  }
}

// Show prompt for missing questions
function showPrompt({ site, missing, application_id }) {
  currentQuestions = missing;
  currentSite = site;
  currentApplicationId = application_id;
  
  elements.promptSection.classList.remove('hidden');
  elements.questionsContainer.innerHTML = '';
  
  missing.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
      <label class="question-label">
        ${q.question_text || q.question_key}
        <span class="question-key">${q.question_key}</span>
      </label>
      <textarea 
        id="answer-${index}" 
        placeholder="Enter your answer..."
        data-question-key="${q.question_key}"
        data-question-text="${q.question_text || q.question_key}"
      ></textarea>
    `;
    elements.questionsContainer.appendChild(questionDiv);
  });
}

// Save answers
elements.saveAnswersBtn.addEventListener('click', async () => {
  elements.saveAnswersBtn.disabled = true;
  showStatus('Saving answers...', 'info');
  
  const answers = [];
  currentQuestions.forEach((q, index) => {
    const textarea = document.getElementById(`answer-${index}`);
    const answer_text = textarea.value.trim();
    
    if (answer_text) {
      answers.push({
        question_key: textarea.dataset.questionKey,
        question_text: textarea.dataset.questionText,
        answer_text,
        site: currentSite,
        application_id: currentApplicationId
      });
    }
  });
  
  if (answers.length === 0) {
    showStatus('Please provide at least one answer', 'error');
    elements.saveAnswersBtn.disabled = false;
    return;
  }
  
  try {
    for (const answer of answers) {
      const response = await chrome.runtime.sendMessage({
        type: 'save-answer',
        payload: answer
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
    }
    
    showStatus('Answers saved successfully!', 'success');
    elements.promptSection.classList.add('hidden');
    elements.statFilled.textContent = (parseInt(elements.statFilled.textContent) || 0) + answers.length;
    
    // Notify content script to continue
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'answers-provided',
          answers
        }).catch(() => {
          // Tab might not have the content script
        });
      }
    });
  } catch (err) {
    showStatus(`Error saving: ${err.message}`, 'error');
  } finally {
    elements.saveAnswersBtn.disabled = false;
  }
});

// Skip
elements.skipBtn.addEventListener('click', () => {
  elements.promptSection.classList.add('hidden');
  showStatus('Skipped', 'info');
});

console.log('AutoApply Assistant popup loaded');
