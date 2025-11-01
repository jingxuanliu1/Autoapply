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

console.log('AutoApply bridge loaded');