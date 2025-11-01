// Shared utilities for the extension
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://cpqtcjrxvqzelagryfmv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcXRjanJ4dnF6ZWxhZ3J5Zm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg1MTUsImV4cCI6MjA3NzUzNDUxNX0.bXH2CpcN8hC5iprBESl968Vg7Hw5JReWnDOdd6vKSyc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function detectSite(url) {
  if (/greenhouse\.io/i.test(url)) return 'greenhouse';
  if (/lever\.co/i.test(url)) return 'lever';
  if (/myworkdayjobs\.com/i.test(url)) return 'workday';
  return 'generic';
}

export function pickScript(site, url) {
  const detected = detectSite(url);
  const finalSite = site || detected;
  
  if (finalSite === 'greenhouse') return 'sites/greenhouse.js';
  if (finalSite === 'lever') return 'sites/lever.js';
  if (finalSite === 'workday') return 'sites/workday.js';
  return 'sites/generic.js';
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Auth error:', error);
    return null;
  }
  return user;
}

export function fillInput(element, value) {
  if (!element || value == null) return false;
  
  if (element.tagName === 'SELECT') {
    element.value = value;
  } else if (element.type === 'checkbox') {
    element.checked = value === true || value === 'true' || value === 'yes';
  } else if (element.type === 'radio') {
    element.checked = element.value === value;
  } else {
    element.value = value;
  }
  
  // Trigger events for React/Vue forms
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
  
  return true;
}

export async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element ${selector} not found after ${timeout}ms`);
}
