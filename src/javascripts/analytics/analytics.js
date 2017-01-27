'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name analytics
 * @description
 * This service exposes an API for event tracking.
 *
 * Call to `enable` enables tracking and initializes
 * session data with user's details. There are three
 * tracking methods that are also used to collect
 * session data (`trackSpaceChange`, `trackStateChange`)
 * . Session data can be obtained with `getSessionData`.
 *
 * The rest of tracking is realised with calls to
 * `send` method. The legacy `track` method is still
 * included in the API, but we should migrate away
 * from it.
 *
 * Calling `enable` doesn't mean that the events
 * will be sent to Segment and Snowplow automatically. We perform
 * an environment check to determine if we should do
 * networking. Events are always sent to an instance
 * of `analytics/console`.
 *
 * Once disabled, this service cannot be enabled
 * again.
 */
.factory('analytics', ['require', function (require) {
  var env = require('environment').env;
  var segment = require('analytics/segment');
  var userData = require('analytics/userData');
  var analyticsConsole = require('analytics/console');
  var stringifySafe = require('stringifySafe');
  var Snowplow = require('analytics/snowplow/Snowplow').default;
  var SnowplowSchemas = require('analytics/snowplow/Schemas').default;
  var validateEvent = require('analytics/validateEvent');

  var ANALYTICS_ENVS = ['production', 'staging', 'preview'];
  var VALUE_UNKNOWN = {};

  var shouldSend = _.includes(ANALYTICS_ENVS, env);
  var session = {};
  var isDisabled = false;

  return {
    enable: _.once(enable),
    disable: disable,
    getSessionData: getSessionData,
    track: track,
    trackSpaceChange: trackSpaceChange,
    trackStateChange: trackStateChange,
    trackEntityAction: trackEntityAction
  };

  /**
   * @ngdoc method
   * @name analytics#enable
   * @description
   * Starts event tracking
   */
  function enable (user) {
    if (isDisabled) {
      return;
    }

    if (shouldSend) {
      segment.enable();
      Snowplow.enable();
    }

    identify(userData.prepare(removeCircularRefs(user)));
    track('global:app_loaded');
  }

  /**
   * @ngdoc method
   * @name analytics#disable
   * @description
   * Stops event tracking, communication, cleans up
   * session data and blocks next `enable` calls.
   */
  function disable () {
    segment.disable();
    Snowplow.disable();
    isDisabled = true;
    session = {};
    sendSessionDataToConsole();
  }

  /**
   * @ngdoc method
   * @name analytics#getSessionData
   * @param {string|array?} path
   * @param {any?} defaultValue
   * @returns {object}
   * @description
   * Gets session data. If `path` is provided then
   * dotty is used to extract specific nested value.
   */
  function getSessionData (path, defaultValue) {
    return dotty.get(session, path || [], defaultValue);
  }

  /**
   * @ngdoc method
   * @name analytics#track
   * @param {string} event
   * @param {object?} data
   * @description
   * Sends tracking event (with optionally provided data) to Segment and Snowplow
   * if it is on the valid events list.
   */
  function track (event, data) {
    if (validateEvent(event)) {
      data = _.isObject(data) ? _.cloneDeep(data) : {};
      data = _.extend(data, getBasicPayload());
      segment.track(event, data);
      Snowplow.track(event, data);
      analyticsConsole.add(event, data);
    }
  }

  /**
   * @ngdoc method
   * @name analytics#trackEntityAction
   * @param {string} event
   * @param {object?} data
   * @description
   * Only tracked in Snowplow
   */
  function trackEntityAction (event, data) {
    if (SnowplowSchemas.getByEventName(event)) {
      data = _.isObject(data) ? _.cloneDeep(data) : {};
      data = _.extend(data, getBasicPayload());
      Snowplow.trackEntityAction(event, data);
      analyticsConsole.add(event, data);
    }
  }

  /**
   * @ngdoc method
   * @name analytics#identify
   * @param {object} extension
   * @description
   * Sets or extends session user data. Identifying
   * data is also set on Segment's client.
   */
  function identify (extension) {
    session.user = session.user || {};
    var user = _.merge(session.user, extension || {});
    var userId = getSessionData('user.sys.id');

    if (userId && user) {
      segment.identify(userId, user);
      Snowplow.identify(userId);
    }

    sendSessionDataToConsole();
  }

  /**
   * @ngdoc method
   * @name analytics#trackSpaceChange
   * @param {API.Space} space
   * @description
   * Sets or replaces session space and organization
   * data. Pass `null` when leaving space context.
   */
  function trackSpaceChange (space) {
    if (space) {
      session.space = removeCircularRefs(dotty.get(space, 'data', {}));
      session.organization = removeCircularRefs(dotty.get(space, 'data.organization', {}));
    } else {
      session.space = session.organization = null;
    }

    sendSessionDataToConsole();
    track(space ? 'global:space_changed' : 'global:space_left');
  }

  /**
   * @ngdoc method
   * @name analytics#trackStateChange
   * @param {object} state
   * @param {object} params
   * @param {object} from
   * @param {object} fromParams
   * @description
   * Sets or replaces session navigation data.
   * Accepts arguments of `$stateChangeSuccess`
   * handler. Current state is set as a page on
   * the Segment's client.
   */
  function trackStateChange (state, params, from, fromParams) {
    var data = session.navigation = removeCircularRefs({
      state: state.name,
      params: params,
      fromState: from ? from.name : null,
      fromStateParams: fromParams || null
    });

    sendSessionDataToConsole();
    track('global:state_changed', data);
    segment.page(state.name, params);
  }

  function getBasicPayload () {
    return _.pickBy({
      userId: getSessionData('user.sys.id', VALUE_UNKNOWN),
      spaceId: getSessionData('space.sys.id', VALUE_UNKNOWN),
      organizationId: getSessionData('organization.sys.id', VALUE_UNKNOWN),
      currentState: getSessionData('navigation.state', VALUE_UNKNOWN)
    }, function (val) {
      return val !== VALUE_UNKNOWN;
    });
  }

  function sendSessionDataToConsole () {
    analyticsConsole.setSessionData(session);
  }

  function removeCircularRefs (obj) {
    return JSON.parse(stringifySafe(obj));
  }
}])

/**
 * @ngdoc service
 * @name analytics/userData
 * @description
 * A simple service preparing user data for
 * the analytical purposes.
 */
.factory('analytics/userData', ['require', function (require) {
  var cookieStore = require('TheStore/cookieStore');

  return {
    prepare: prepareUserData
  };

  /**
   * @ngdoc method
   * @name analytics/userData#prepare
   * @param {object} userData
   * @returns {object}
   * @description
   * Sanitizes and extends user data with details
   * specific to the first visit.
   */
  function prepareUserData (userData) {
    if (userData.signInCount === 1) {
      // On first login, send referrer, campaign and A/B test data
      // if it has been set in marketing website cookie
      return _.merge(getFirstVisitData(), userData);
    } else {
      return userData;
    }
  }

  function getFirstVisitData () {
    return _.pickBy({
      firstReferrer: parseCookie('cf_first_visit', 'referer'),
      campaignName: parseCookie('cf_first_visit', 'campaign_name'),
      lastReferrer: parseCookie('cf_last_visit', 'referer'),
      experimentId: parseCookie('cf_experiment', 'experiment_id'),
      experimentVariationId: parseCookie('cf_experiment', 'variation_id')
    }, function (val) {
      return val !== null && val !== undefined;
    });
  }

  function parseCookie (cookieName, prop) {
    try {
      var cookie = cookieStore.get(cookieName);
      return JSON.parse(cookie)[prop];
    } catch (err) {
      return null;
    }
  }
}]);
