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

export function open(initialContent) {
  if (!enabled) {
    return Promise.resolve();
  }

  return LazyLoader.getFromGlobal('Intercom').then(Intercom =>
    Intercom('showNewMessage', initialContent)
  );
}

export function trackEvent(eventName, metadata) {
  if (!enabled) {
    return Promise.resolve();
  }

  return LazyLoader.getFromGlobal('Intercom').then(Intercom =>
    Intercom('trackEvent', eventName, metadata)
  );
}
