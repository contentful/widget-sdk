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
  var cookieStore = require('TheStore/cookieStore');
  var stringifySafe = require('stringifySafe');
  var environment = require('environment');
  var analyticsConsole = require('analytics/console');

  var env = dotty.get(environment, 'env');
  var shouldSend = _.includes(['production', 'staging', 'preview'], env);
  var session = {};

  var API = {
    enable: _.once(enable),
    disable: disable,
    track: track,
    trackSpaceChange: trackSpaceChange,
    trackStateChange: trackStateChange,
    trackPersonaSelection: trackPersonaSelection,

    // TODO: revisit this method
    trackPersistentNotificationAction: trackPersistentNotificationAction
  };

  return API;

  function enable (user) {
    if (shouldSend) {
      segment.enable();
    }

    identify(prepareUserData(user));
    track('app:loaded');
  }

  function disable () {
    segment.disable();
    API.enable = _.noop;
    session = {};
  }

  function track (event, data) {
    data = _.merge({}, data, getSpaceData());
    segment.track(event, data);
    analyticsConsole.add(event, 'Segment', data);
  }

  function identify (extension) {
    session.user = session.user || {};
    var user = _.merge(session.user, extension || {});
    var userId = dotty.get(user, 'sys.id');

    if (userId) {
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

    track('app:space_changed', {
      spaceId: dotty.get(session.space, 'sys.id'),
      organizationId: dotty.get(session.organization, 'sys.id')
    });
  }

  function trackStateChange (state, params, from, fromParams) {
    segment.page(state.name, params);
    track('Switched State', {
      state: state.name,
      params: params,
      fromState: from ? from.name : null,
      fromStateParams: fromParams || null
    });
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
      track('Selected Persona', trait);
      track('user:persona_selected', trait);
    } else {
      track('Skipped Persona Selection');
      track('user:persona_selection_skipped');
    }
  }

  function getSpaceData () {
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

  function trackPersistentNotificationAction (name) {
    var currentPlan = dotty.get(session.organization, 'subscriptionPlan.name');
    track('Clicked Top Banner CTA Button', {
      action: name,
      currentPlan: currentPlan !== undefined ? currentPlan : null
    });
  }

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
