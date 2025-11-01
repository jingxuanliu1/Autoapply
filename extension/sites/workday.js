// Workday content script
(async function() {
  console.log('Workday content script loaded');
  
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
  
  async function waitForElement(selector, timeout = 15000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return null;
  }
  
  // Wait for Workday form (they use slow loading)
  await waitForElement('input[data-automation-id], [data-automation-id="formField-firstName"]');
  
  console.log('Workday form detected');
  
  // Workday uses data-automation-id attributes
  const selectors = {
    firstName: '[data-automation-id="formField-firstName"]',
    lastName: '[data-automation-id="formField-lastName"]',
    email: '[data-automation-id="formField-email"]',
    phone: '[data-automation-id="formField-phone"]'
  };
  
  const profileData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '5551234567'
  };
  
  for (const [key, selector] of Object.entries(selectors)) {
    const element = document.querySelector(selector);
    if (element && profileData[key]) {
      fillInput(element, profileData[key]);
      console.log(`Filled ${key}`);
    }
  }
  
  console.log('Workday script completed');
})();
