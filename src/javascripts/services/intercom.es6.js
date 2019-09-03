import * as LazyLoader from 'utils/LazyLoader.es6';

// intercom.com is a 3rd party solution for user communication and targeting.
// We inject it using Segment and we need to grab a reference from its global.

let enabled = true;

export function isEnabled() {
  return enabled;
}

export function disable() {
  enabled = false;
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
