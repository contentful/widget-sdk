'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 * This service exposes an API for event tracking.
 */
angular.module('contentful')

.factory('analytics', ['require', function (require) {
  var lazyLoad = require('LazyLoader').get;
  var segment = require('segment');
  var logger = require('logger');
  var cookieStore = require('TheStore/cookieStore');
  var stringifySafe = require('stringifySafe');
  var environment = require('environment');
  var analyticsConsole = require('analytics/console');

  var env = dotty.get(environment, 'env');
  var shouldSend = _.includes(['production', 'staging', 'preview'], env);
  var data = {};

  // TODO: migrate `userData` to `data` hash
  var userData;

  var API = {
    enable: _.once(enable),
    disable: disable,
    track: track,
    trackSpaceChange: trackSpaceChange,
    trackStateChange: trackStateChange,

    // TODO: revisit these methods
    addIdentifyingData: addIdentifyingData,
    trackPersistentNotificationAction: trackPersistentNotificationAction
  };

  return API;

  function enable (user) {
    if (shouldSend) {
      segment.enable();
    }

    userData = user;
    initialize();
    track('app:open', {userId: user.sys.id});

    // TODO: verify if we need fontsDotCom
    lazyLoad('fontsDotCom');
  }

  function disable () {
    segment.disable();
    API.enable = _.noop;
    data = {};
  }

  function trackSpaceChange (space) {
    if (space) {
      data.space = dotty.get(space, 'data', {});
      data.organization = dotty.get(space, 'data.organization', {});
    } else {
      data.space = data.organization = null;
    }

    track('app:space_changed', {
      spaceId: dotty.get(data.space, 'sys.id'),
      organizationId: dotty.get(data.organization, 'sys.id')
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

  function getSpaceData () {
    try {
      return {
        spaceIsTutorial: data.space.tutorial,
        spaceSubscriptionKey: data.organization.sys.id,
        spaceSubscriptionState: data.organization.subscriptionState,
        spaceSubscriptionInvoiceState: data.organization.invoiceState,
        spaceSubscriptionSubscriptionPlanKey: data.organization.subscriptionPlan.sys.id,
        spaceSubscriptionSubscriptionPlanName: data.organization.subscriptionPlan.name
      };
    } catch (err) {
      return {};
    }
  }

  function track (event, data) {
    data = _.merge({}, data, getSpaceData());
    segment.track(event, data);
    analyticsConsole.add(event, 'Segment', data);
  }

  function initialize () {
    shieldFromInvalidUserData(function () {
      if (userData) {
        addIdentifyingData(getAnalyticsUserData(userData));
      }
    });
  }

  // Send further identifying user data to segment
  function addIdentifyingData (data) {
    shieldFromInvalidUserData(function () {
      segment.identify(userData.sys.id, data);
    });
  }

  function trackPersistentNotificationAction (name) {
    var currentPlan = dotty.get(data.organization, 'subscriptionPlan.name');
    track('Clicked Top Banner CTA Button', {
      action: name,
      currentPlan: currentPlan !== undefined ? currentPlan : null
    });
  }

  function shieldFromInvalidUserData (cb) {
    try {
      cb();
    } catch (error) {
      logger.logError('Analytics user data exception', {
        data: {
          userData: userData,
          error: error
        }
      });
    }
  }

  function getAnalyticsUserData (userData) {
    // Remove circular references
    userData = JSON.parse(stringifySafe(userData));

    // On first login, send referrer, campaign and A/B test data to
    // segment if it has been set by marketing website cookie
    if (userData.signInCount === 1) {
      var firstVisitData = _.pickBy({
        firstReferrer: parseCookie('cf_first_visit', 'referer'),
        campaignName: parseCookie('cf_first_visit', 'campaign_name'),
        lastReferrer: parseCookie('cf_last_visit', 'referer'),
        experimentId: parseCookie('cf_experiment', 'experiment_id'),
        experimentVariationId: parseCookie('cf_experiment', 'variation_id')
      }, function (val) {
        return val !== null && val !== undefined;
      });
      return _.merge(firstVisitData, userData);
    } else {
      return userData;
    }
  }

  function parseCookie (cookieName, prop) {
    try {
      var cookie = cookieStore.get(cookieName);
      return JSON.parse(cookie)[prop];
    } catch (e) {
      return;
    }
  }
}]);
