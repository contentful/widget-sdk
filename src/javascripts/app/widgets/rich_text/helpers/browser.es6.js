import { detect as detectBrowser } from 'detect-browser';
const browser = detectBrowser();

export function isIE() {
  return browser.name === 'ie';
}

export function isEdge() {
  return browser.name === 'edge';
}
