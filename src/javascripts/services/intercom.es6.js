import { registerFactory } from 'NgRegistry.es6';

/**
 * @name intercom
 * @description Intercom is a 3rd party (https://www.intercom.com/) solution.
 * We inject it into our page via Segment.io, and also segment sends all
 * tracking data into intercom as well.
 * Info about our Segment integration - https://contentful.atlassian.net/wiki/spaces/ENG/pages/2949262/Segment.io
 *
 * If you want to customize intercom, you need to do so from the intercom
 * interface itself - https://docs.intercom.com/configure-intercom-for-your-product-or-site/customize-the-intercom-messenger/customize-the-intercom-messenger-basics
 *
 * Intercom JS Api is very limited - https://developers.intercom.com/v2.0/docs/intercom-javascript
 * `boot` and `update` methods are called automatically by segment integration code
 * so we can only show/hide intercom window from JS. We can not customize team description,
 * faces which appear (faces are automatic by Intercom, description in Intercom interface) on the fly,
 * and we can not open several intercoms with different teams and descriptions.
 *
 * This module provides access to global Intercom object; we don't have information when it is
 * instantiated, so it might be not available if you call it immediately.
 */

registerFactory('intercom', [
  '$window',
  $window => {
    let isDisabled = false;

    const intercom = {
      isLoaded: isLoaded,
      isEnabled: isEnabled,
      disable: disable,
      open: openIntercom,
      trackEvent: trackEvent
    };

    function isLoaded() {
      return !!$window.Intercom;
    }

    function isEnabled() {
      return !isDisabled;
    }

    function disable() {
      isDisabled = true;
    }

    function openIntercom(initialContent) {
      if (isLoaded()) {
        $window.Intercom('showNewMessage', initialContent);
      }
    }

    function trackEvent(eventName, metadata) {
      if (isLoaded()) {
        $window.Intercom('trackEvent', eventName, metadata);
      }
    }

    return intercom;
  }
]);
