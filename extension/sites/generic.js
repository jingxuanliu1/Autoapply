// Generic content script for other job sites
(async function() {
  console.log('Generic content script loaded for:', window.location.href);
  
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
  
  // Try common form field patterns
  const patterns = {
    firstName: /first.*name|fname|given.*name/i,
    lastName: /last.*name|lname|surname|family.*name/i,
    email: /email|e-mail/i,
    phone: /phone|tel|mobile/i
  };
  
  const profileData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567'
  };
  
  // Find all text inputs and try to match
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');
  
  inputs.forEach(input => {
    const name = input.name || input.id || input.placeholder || '';
    
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(name) && profileData[key]) {
        fillInput(input, profileData[key]);
        console.log(`Filled ${key} in generic form`);
        break;
      }
    }
  });
  
  console.log('Generic script completed - manual review recommended');
  
  // Notify user
  chrome.runtime.sendMessage({
    type: 'filled-result',
    payload: {
      application_id: null,
      status: 'needs-review',
      message: 'Generic site - please review form before submitting'
    }
  });
})();
