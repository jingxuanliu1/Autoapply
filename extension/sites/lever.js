// Lever.co content script
(async function() {
  console.log('Lever content script loaded');
  
  function fillInput(element, value) {
    if (!element || value == null) return false;
    
    if (element.tagName === 'SELECT') {
      element.value = value;
    } else if (element.type === 'checkbox') {
      element.checked = value === true || value === 'true' || value === 'yes' || value === 'Yes';
    } else {
      element.value = value;
    }
    
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
  
  // Wait for form
  await waitForElement('form, input[name="name"], input[name="email"]');
  
  console.log('Lever form detected');
  
  // Lever selectors
  const selectors = {
    name: 'input[name="name"]',
    email: 'input[name="email"]',
    phone: 'input[name="phone"]',
    resume: 'input[name="resume"]',
    cover_letter: 'input[name="cover_letter"]'
  };
  
  const profileData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567'
  };
  
  for (const [key, selector] of Object.entries(selectors)) {
    const element = document.querySelector(selector);
    if (element && profileData[key]) {
      fillInput(element, profileData[key]);
      console.log(`Filled ${key}`);
    }
  }
  
  console.log('Lever script completed');
})();
