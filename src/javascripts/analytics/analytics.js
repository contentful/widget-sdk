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
  var $rootScope = require('$rootScope');
  var GTM = require('analytics/gtm');

  var env = dotty.get(require('environment'), 'env');
  var shouldSend = _.includes(['production', 'staging'], env);

  var organizationData, spaceData, userData;
  var turnOffStateChangeListener = null;

  var API = {
    enable: _.once(enable),
    disable: disable,
    setSpace: setSpace,
    addIdentifyingData: addIdentifyingData,
    track: track,
    trackPersistentNotificationAction: trackPersistentNotificationAction,
    // TODO: remove this method
    pushGtm: pushGtm
  };

  return API;

  /**
   * @ngdoc method
   * @name analytics#enable
   * @param {API.User} user
   */
  function enable (user) {
    segment.enable(shouldSend);

    // TODO: remove GTM pushes
    GTM.enable();
    GTM.push({
      event: 'app.open',
      userId: user.sys.id
    });

    // TODO: verify if we need fontsDotCom
    lazyLoad('fontsDotCom');

    turnOffStateChangeListener = $rootScope.$on('$stateChangeSuccess', trackStateChange);
    userData = user;
    initialize();
  }

  function disable () {
    segment.disable();
    API.enable = _.noop;

    GTM.disable();

    if (_.isFunction(turnOffStateChangeListener)) {
      turnOffStateChangeListener();
      turnOffStateChangeListener = null;
    }

    _.forEach(API, function (_value, key) {
      API[key] = _.noop;
    });
  }

  function setSpace (space) {
    if (space) {
      try {
        organizationData = space.data.organization;
        spaceData = {
          spaceIsTutorial: space.data.tutorial,
          spaceSubscriptionKey: space.data.organization.sys.id,
          spaceSubscriptionState: space.data.organization.subscriptionState,
          spaceSubscriptionInvoiceState: space.data.organization.invoiceState,
          spaceSubscriptionSubscriptionPlanKey: space.data.organization.subscriptionPlan.sys.id,
          spaceSubscriptionSubscriptionPlanName: space.data.organization.subscriptionPlan.name
        };
        GTM.push({
          spaceId: space.data.sys.id,
          organizationId: organizationData.sys.id
        });
      } catch (error) {
        logger.logError('Analytics space organizations exception', {
          data: {
            space: space,
            error: error
          }
        });
      }
      initialize();
    } else {
      spaceData = null;
      organizationData = null;
    }
  }

  function track (event, data) {
    segment.track(event, _.merge({}, data, spaceData));
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

  function trackStateChange (_event, state, stateParams, fromState, fromStateParams) {
    segment.page(state.name, stateParams);
    track('Switched State', {
      state: state.name,
      params: stateParams,
      fromState: fromState ? fromState.name : null,
      fromStateParams: fromStateParams || null
    });
  }

  function trackPersistentNotificationAction (name) {
    var currentPlan = dotty.get(organizationData, 'subscriptionPlan.name');
    track('Clicked Top Banner CTA Button', {
      action: name,
      currentPlan: currentPlan !== undefined ? currentPlan : null
    });
  }

  function pushGtm (obj) {
    GTM.push(obj);
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
