import * as Analytics from 'analytics/Analytics';

export function init() {
  // When the window loses focus ("blur" event) it may
  // mean that a document of an <iframe> rendering an
  // Extension was focused.
  window.addEventListener('blur', onBlur);
}

function onBlur() {
  // Check if the active element is an iframe.
  const active = document.activeElement;
  const isIframe = active && active instanceof window.HTMLIFrameElement;

  if (!isIframe) {
    return;
  }

  const iframe = active;

  // If the iframe is rendering an Extension then
  // it has some data attached in data-* attributes.
  const { extensionId, location, extensionDefinitionId } = iframe.dataset;

  if (extensionId) {
    Analytics.track('extension:activate', {
      extensionId,
      location,
      extensionDefinitionId
    });
  }
}
