'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 * This service exposes an API for event tracking.
 */
angular.module('contentful')

.factory('analytics', ['require', function (require) {
  var segment = require('segment');
  var environment = require('environment');
  var userData = require('analytics/userData');
  var analyticsConsole = require('analytics/console');

  var env = dotty.get(environment, 'env');
  var shouldSend = _.includes(['production', 'staging', 'preview'], env);
  var session = {};

  var API = {
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

  return API;

  function enable (user) {
    if (shouldSend) {
      segment.enable();
    }

    identify(userData.prepare(user));
    send('global:app_loaded');
  }

  function disable () {
    segment.disable();
    API.enable = _.noop;
    session = {};
  }

  function getSessionData (path) {
    return dotty.get(session, path || []);
  }

  function send (event, data) {
    data = _.extend({}, data);
    segment.track(event, data);
    analyticsConsole.add(event, 'Segment', data);
  }

  function identify (extension) {
    session.user = session.user || {};
    var user = _.merge(session.user, extension || {});
    var userId = dotty.get(user, 'sys.id');

    if (userId && user) {
      segment.identify(userId, user);
    }
  }

  function trackSpaceChange (space) {
    if (space) {
      session.space = dotty.get(space, 'data', {});
      session.organization = dotty.get(space, 'data.organization', {});
    } else {
      session.space = session.organization = null;
    }

    if (space) {
      send('global:space_changed', {
        spaceId: dotty.get(session.space, 'sys.id'),
        organizationId: dotty.get(session.organization, 'sys.id')
      });
    } else {
      send('global:space_left');
    }

  }

  function trackStateChange (state, params, from, fromParams) {
    segment.page(state.name, params);
    var data = {
      state: state.name,
      params: params,
      fromState: from ? from.name : null,
      fromStateParams: fromParams || null
    };

    trackLegacy('Switched State', data);
    send('global:state_changed', data);
  }

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

  // TODO: eliminate calls to this method
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

.factory('analytics/userData', ['require', function (require) {
  var cookieStore = require('TheStore/cookieStore');
  var stringifySafe = require('stringifySafe');

  return {
    prepare: prepareUserData
  };

  function prepareUserData (userData) {
    // Remove circular references
    userData = JSON.parse(stringifySafe(userData));

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
