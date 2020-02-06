import { detect as detectBrowser } from 'detect-browser';
const browser = detectBrowser();

export function isEdge() {
  return !!(browser && browser.name === 'edge');
}
