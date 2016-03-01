'use strict';

/**
 * @ngdoc service
 * @name analytics/track
 * @description
 *
 * Returns an object with the same interface as the proper
 * analytics service, except that all functions are replaced by
 * noops.
 */
angular.module('contentful')
.factory('analytics/track', ['$injector', function ($injector) {

  var segment       = $injector.get('segment');
  var totango       = $injector.get('totango');
  var fontsdotcom   = $injector.get('fontsdotcom');
  var logger        = $injector.get('logger');
  var cookieStore   = $injector.get('TheStore/cookieStore');
  var stringifySafe = $injector.get('stringifySafe');

  var organizationData, spaceData, userData;

  var analytics = {
    enable: enable,
    disable: disable,
    setSpace: setSpace,
    setUserData: setUserData,
    addIdentifyingData: addIdentifyingData,
    /**
     * @ngdoc method
     * @name analytics#track
     * @description
     * Send `data` merged with information about the space to
     * Segment.
     *
     * @param {string} event
     * @param {object} data
     */
    track: track,
    /**
     * @ngdoc method
     * @name analytics#trackTotango
     * @description
     * Send event to Totango.
     *
     * Note that for new analytics events 'module' should be "UI" to
     * keep the number of modules in Totango low.
     *
     * @param {string} event
     * @param {string} module
     */
    trackTotango: trackTotango,
    trackPersistentNotificationAction: trackPersistentNotificationAction,
    stateActivated: stateActivated
  };
  return analytics;

  function enable () {
    segment.enable();
    totango.enable();
    fontsdotcom.enable();
  }

  function disable () {
    segment.disable();
    totango.disable();
    _.forEach(analytics, function (value, key) {
      analytics[key] = _.noop;
    });
  }

  function setSpace (space) {
    if (space) {
      try {
        organizationData = space.data.organization;
        spaceData = {
          spaceIsTutorial:                       space.data.tutorial,
          spaceSubscriptionKey:                  space.data.organization.sys.id,
          spaceSubscriptionState:                space.data.organization.subscriptionState,
          spaceSubscriptionInvoiceState:         space.data.organization.invoiceState,
          spaceSubscriptionSubscriptionPlanKey:  space.data.organization.subscriptionPlan.sys.id,
          spaceSubscriptionSubscriptionPlanName: space.data.organization.subscriptionPlan.name
        };
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

  function setUserData (user) {
    userData = user;
    initialize();
  }

  function track (event, data) {
    segment.track(event, _.merge({}, data, spaceData));
  }

  function trackTotango (event, module) {
    try {
      totango.track(event, module);
    } catch (error) {
      logger.logError('Analytics totango.track() exception', {
        data: {
          event: event,
          module: module,
          error: error
        }
      });
    }
  }

  function initialize () {
    if (!userData) {
      return;
    }
    var analyticsUserData;

    shieldFromInvalidUserData(function () {
      analyticsUserData = getAnalyticsUserData(userData);
      addIdentifyingData(analyticsUserData);
    });

    if (analyticsUserData && organizationData) {
      try {
        totango.initialize(analyticsUserData, organizationData);
      } catch (error) {
        logger.logError('Analytics totango.initialize() exception', {
          data: {
            userData: analyticsUserData,
            organizationData: organizationData,
            error: error
          }
        });
      }
    }
  }

  // Send further identifying user data to segment
  function addIdentifyingData (data) {
    shieldFromInvalidUserData(function () {
      segment.identify(userData.sys.id, data);
    });
  }

  function stateActivated (state, stateParams, fromState, fromStateParams) {
    totango.setModule(state.name);
    segment.page(state.name, stateParams);
    track('Switched State', {
      state: state.name,
      params: stateParams,
      fromState: fromState ? fromState.name : null,
      fromStateParams: fromStateParams || null
    });
  }

  function trackPersistentNotificationAction (name) {
    track('Clicked Top Banner CTA Button', {
      action: name,
      currentPlan: organizationData.subscriptionPlan.name
    });
  }

  function shieldFromInvalidUserData (cb) {
    try {
      return cb.apply(null, arguments);
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
    // segment and totango if it has been set by marketing website cookie
    if (userData.signInCount === 1) {
      var firstVisitData = _.pick({
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
    } catch (e) {}
  }
}]);
