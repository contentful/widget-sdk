import { detect as detectBrowser } from 'detect-browser';
const browser = detectBrowser();

export function isIE() {
  return !!(browser && browser.name === 'ie');
}

export function isEdge() {
  return !!(browser && browser.name === 'edge');
}
