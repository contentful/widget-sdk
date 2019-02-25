import * as K from 'utils/kefir.es6';
import { getModule } from 'NgRegistry.es6';
import * as userAgent from 'services/userAgent.es6';

const $window = getModule('$window');

/**
 * Create a stream of messages send with `window.postMessage` from the Iframe.
 *
 * The stream contains only the `data` property of the emitted events.
 *
 * @param {DOM.Iframe} iframe
 * @returns {K.Stream<any>}
 */
export default function create(iframe) {
  return K.fromEvents($window, 'message').flatten(ev => {
    if (iframe.contentWindow !== ev.source) {
      return [];
    }
    const normalizedEv = normalizeEvent(ev);
    if (normalizedEv) {
      return [normalizedEv.data];
    } else {
      return [];
    }
  });
}

// On IE we can only send strings. We need to parse the data in that case
// The complementary code is in the Gatekeeper repository.
function normalizeEvent(event) {
  if (userAgent.isIE()) {
    try {
      return {
        data: JSON.parse(event.data),
        source: event.source
      };
    } catch (e) {
      return;
    }
  } else {
    return event;
  }
}
