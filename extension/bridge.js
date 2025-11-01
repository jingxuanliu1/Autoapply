// Bridge between website and extension
// Listens to your website's window.postMessage
window.addEventListener('message', (e) => {
  if (!e?.data || e.source !== window) return;
  if (e.data.type === 'AUTOAPPLY_START') {
    chrome.runtime.sendMessage({ 
      type: 'open-next', 
      count: e.data.payload?.count ?? 25 
    });
  }
});

// Listen for progress from background and post back to website
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'progress') {
    window.postMessage({
      type: 'AUTOAPPLY_PROGRESS',
      payload: { processed: msg.processed, total: msg.total, active: msg.active }
    }, '*');
  }
});

console.log('AutoApply bridge loaded');
