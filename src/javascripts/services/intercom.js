import * as LazyLoader from 'utils/LazyLoader';

// intercom.com is a 3rd party solution for user communication and targeting.
// We inject it using Segment and we need to grab a reference from its global.

let enabled = false;

export function enable() {
  enabled = true;
}

export function isEnabled() {
  return enabled;
}

export async function open(initialContent) {
  if (enabled) {
    const Intercom = await LazyLoader.getFromGlobal('Intercom');
    return Intercom('showNewMessage', initialContent);
  }
}

export async function trackEvent(eventName, metadata) {
  if (enabled) {
    const Intercom = await LazyLoader.getFromGlobal('Intercom');
    return Intercom('trackEvent', eventName, metadata);
  }
}

export async function startTour(tourId) {
  if (enabled) {
    const Intercom = await LazyLoader.getFromGlobal('Intercom');
    return Intercom('startTour', tourId);
  }
}
