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
 * session data (`trackSpaceChange`, `trackStateChange`,
 * `trackPersonaSelection`). Session data can be
 * obtained with `getSessionData`.
 *
 * The rest of tracking is realised with calls to
 * `send` method. The legacy `track` method is still
 * included in the API, but we should migrate away
 * from it.
 *
 * Calling `enable` doesn't mean that the events
 * will be sent to Segment automatically. We perform
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

  var SEGMENT_ENVS = ['production', 'staging', 'preview'];

  var shouldSend = _.includes(SEGMENT_ENVS, env);
  var session = {};
  var isDisabled = false;

  return {
    enable: _.once(enable),
    disable: disable,
    getSessionData: getSessionData,
    send: send,
    trackSpaceChange: trackSpaceChange,
    trackStateChange: trackStateChange,
    trackPersonaSelection: trackPersonaSelection,

    // TODO: eliminate calls to this method
    track: trackLegacy
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
    }

    identify(userData.prepare(removeCircularRefs(user)));
    send('global:app_loaded');
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
    isDisabled = true;
    session = {};
    sendSessionDataToConsole();
  }

  /**
   * @ngdoc method
   * @name analytics#getSessionData
   * @param {string|array?} path
   * @returns {object}
   * @description
   * Gets session data. If `path` is provided then
   * dotty is used to extract specific nested value.
   */
  function getSessionData (path) {
    return dotty.get(session, path || []);
  }

  /**
   * @ngdoc method
   * @name analytics#send
   * @param {string} event
   * @param {object?} data
   * @description
   * Sends tracking event (with optionally provided
   * data) to Segment.
   */
  function send (event, data) {
    data = _.isObject(data) ? _.cloneDeep(data) : {};
    segment.track(event, data);
    analyticsConsole.add(event, 'Segment', data);
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
    var userId = dotty.get(user, 'sys.id');

    if (userId && user) {
      segment.identify(userId, user);
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

    if (space) {
      send('global:space_changed', {
        spaceId: dotty.get(session.space, 'sys.id'),
        organizationId: dotty.get(session.organization, 'sys.id')
      });
    } else {
      send('global:space_left');
    }

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

    trackLegacy('Switched State', data);
    send('global:state_changed', data);

    segment.page(state.name, params);
  }

  /**
   * @ngdoc method
   * @name analytics#trackPersonaSelection
   * @param {string} personaCode
   * @description
   * Extends session user data with selected
   * persona's name.
   */
  function trackPersonaSelection (personaCode) {
    var personaName = {
      code: 'Coder',
      content: 'Content Manager',
      project: 'Project Manager',
      other: 'Other'
    }[personaCode];

    if (personaName) {
      var trait = {personaName: personaName};
      identify(trait);
      trackLegacy('Selected Persona', trait);
      send('global:persona_selected', trait);
    } else {
      trackLegacy('Skipped Persona Selection');
      send('global:persona_selection_skipped');
    }
  }

  function sendSessionDataToConsole () {
    analyticsConsole.setSessionData(session);
  }

  function removeCircularRefs (obj) {
    return JSON.parse(stringifySafe(obj));
  }

  /**
   * @ngdoc method
   * @name analytics#track
   * @param {string} event
   * @param {object?} data
   * @description
   * Sends an event into Segment. Event data will
   * be extended with session data produced by
   * `getLegacySpaceData`.
   *
   * TODO: eliminate calls to this method!
   */
  function trackLegacy (event, data) {
    data = _.merge({}, data, getLegacySpaceData());
    segment.track(event, data);
    analyticsConsole.add(event, 'Legacy Segment', data);
  }

  function getLegacySpaceData () {
    try {
      return {
        spaceIsTutorial: session.space.tutorial,
        spaceSubscriptionKey: session.organization.sys.id,
        spaceSubscriptionState: session.organization.subscriptionState,
        spaceSubscriptionInvoiceState: session.organization.invoiceState,
        spaceSubscriptionSubscriptionPlanKey: session.organization.subscriptionPlan.sys.id,
        spaceSubscriptionSubscriptionPlanName: session.organization.subscriptionPlan.name
      };
    } catch (err) {
      return {};
    }
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
