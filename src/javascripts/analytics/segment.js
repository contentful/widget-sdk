import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer';
import * as LazyLoader from 'utils/LazyLoader';
import * as logger from 'services/logger';
import window from 'utils/ngCompat/window';

/**
 * All calls (`track`, `page`, `identify`)
 * are buffered and executed after `enable`
 * call. Once disabled, this service cannot
 * be enabled again.
 */

/**
 * Our intercom setup doesn't care about
 * `track()` events sent from UI and it has
 * a limit of 120 unique event names.
 *
 * We forcefully disable this integration
 * here so we won't get exceptions in the
 * dev tools.
 */
const TRACK_INTEGRATIONS = {
  Intercom: false,
};

const buffer = CallBuffer.create();
const bufferedTrack = bufferedCall('track');
let isEnabled = false;

/**
 * Loads lazily the script and starts
 * sending analytical events.
 */
function enable(loadOptions = {}) {
  if (!isEnabled) {
    isEnabled = true;

    install(loadOptions).then(buffer.resolve);
  }
}

function bufferedCall(fnName) {
  return function () {
    const args = _.toArray(arguments);
    buffer.call((analytics) => {
      try {
        analytics[fnName](...args);
      } catch (err) {
        logger.logError('Failed Segment call', {
          err: err,
          msg: err.message,
          analyticsFn: fnName,
          analyticsFnArgs: args,
        });
      }
    });
  };
}

// Adapted from the docs ("step 1" section):
// https://segment.com/docs/sources/website/analytics.js/quickstart/
function install(loadOptions) {
  const analytics = (window.analytics = window.analytics || []);

  if (analytics.initialize || analytics.invoked) {
    return Promise.reject();
  } else {
    analytics.invoked = true;
  }

  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on',
  ];

  analytics.factory = (method) =>
    function () {
      const args = _.toArray(arguments);
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };

  analytics.methods.forEach((key) => {
    analytics[key] = analytics.factory(key);
  });

  analytics.load = _.noop;
  analytics._loadOptions = loadOptions;

  return LazyLoader.get('segment');
}

// we send an event to Segment (Intercom included) if modern onboarding
// flow was completed (onboarding deployment completed). We send it as an
// event, and it is immediately available to react – e.g. send a survey
function sendOnboardingDeploymentEvent(event, data) {
  // we have this information in `element:click` event with certain data
  // so we just check it and if so, send this event.
  if (
    event === 'element:click' &&
    data.elementId &&
    data.elementId.startsWith('deploy_screen_completed')
  ) {
    const provider = data.elementId.split(':')[1];
    // we create yet another event for this specific thing
    // events support human-readable names, and we use them
    bufferedTrack(
      'onboarding deployment completed',
      {
        provider,
      },
      {
        integrations: {
          Intercom: true,
        },
      }
    );
  }
}

export default {
  enable: _.once(enable),
  /**
   * Sends a single event with data to
   * the selected integrations.
   */
  track: function track(event, data) {
    // we need to send an event to segment (Intercom included)
    // usually we don't do that, but you might have to do so
    // alternatively, you can use `updateUserInSegment` from
    // `analytics/Analytics` module, which will set a custom
    // attribute – https://developers.intercom.com/docs/adding-custom-information
    // Intercom docs on events:
    // https://developers.intercom.com/docs/working-with-events
    sendOnboardingDeploymentEvent(event, data);

    bufferedTrack(event, data, { integrations: TRACK_INTEGRATIONS });
  },
  /**
   * Sets current page.
   */
  page: bufferedCall('page'),
  /**
   * Sets current user traits.
   */
  identify: bufferedCall('identify'),
};
