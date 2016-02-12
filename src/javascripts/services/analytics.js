'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 *
 * This service provides an object with different methods to trigger
 * analytics events.
 *
 * The service is disabled in all but the production environment.
 * It can be enabled by appending the '?forceAnalytics' query string to
 * the URL.
 * In the development environment you can send all tracking events to
 * the console for testing by using '?forceAnalyticsDevMode'.
 */
angular.module('contentful')
.provider('analytics', ['environment', function (environment) {
  var load = !environment.env.match(/acceptance|development|preview|test/);
  this.forceLoad = function () { load = true; };

  this.$get = [ '$injector', function ($injector) {
    var $location = $injector.get('$location');

    var segment     = $injector.get('segment');
    var totango     = $injector.get('totango');
    var fontsdotcom = $injector.get('fontsdotcom');
    var logger      = $injector.get('logger');
    var cookieStore = $injector.get('TheStore/cookieStore');
    var stringifySafe  = $injector.get('stringifySafe');

    var analytics = {
      enable: function(){
        segment.enable();
        totango.enable();
        fontsdotcom.enable();
      },

      disable: function(){
        segment.disable();
        totango.disable();
        _.forEach(this, function(value, key){
          this[key] = _.noop;
        }, this);
      },

      setSpace: function (space) {
        if (space) {
          try {
            this._organizationData = space.data.organization;
            this._spaceData = {
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
          this._initialize();
        } else {
          this._spaceData = null;
          this._organizationData = null;
        }
      },

      setUserData: function (user) {
        this._userData = user;
        this._initialize();
      },

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
      track: function (event, data) {
        segment.track(event, _.merge({}, data, this._spaceData));
      },

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
      trackTotango: function (event, module) {
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
      },

      _initialize: function(){
        if (this._userData) {
          var analyticsUserData;

          shieldFromInvalidUserData(function () {
            analyticsUserData = getAnalyticsUserData(this._userData);
            this.addIdentifyingData(analyticsUserData);
          }.bind(this))();

          if (analyticsUserData && this._organizationData) {
            try {
              totango.initialize(analyticsUserData, this._organizationData);
            } catch (error) {
              logger.logError('Analytics totango.initialize() exception', {
                data: {
                  userData: analyticsUserData,
                  organizationData: this._organizationData,
                  error: error
                }
              });
            }
          }
        }

        function parseCookie(cookieName, prop) {
          try {
            var cookie = cookieStore.get(cookieName);
            return JSON.parse(cookie)[prop];
          } catch (e) {}
        }

        // On first login, send referrer, campaign and A/B test data to
        // segment and totango if it has been set by marketing website cookie

        function getAnalyticsUserData(userData) {
          // Remove circular references
          userData = JSON.parse(stringifySafe(userData));

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
      },

      // Send further identifying user data to segment
      addIdentifyingData: shieldFromInvalidUserData(function(data) {
        segment.identify(this._userData.sys.id, data);
      }),

      stateActivated: function (state, stateParams, fromState, fromStateParams) {
        totango.setModule(state.name);
        segment.page(state.name, stateParams);
        this.track('Switched State', {
          state: state.name,
          params: stateParams,
          fromState: fromState ? fromState.name : null,
          fromStateParams: fromStateParams || null
        });
      },

      trackPersistentNotificationAction: function (name) {
        this.track('Clicked Top Banner CTA Button', {
          action: name,
          currentPlan: this._organizationData.subscriptionPlan.name
        });
      }
    };

    function shieldFromInvalidUserData (cb) {
      return function () {
        try {
          return cb.apply(this, arguments);
        } catch (error) {
          logger.logError('Analytics user data exception', {
            data: {
              userData: analytics._userData,
              error: error
            }
          });
        }
      };
    }

    if (forceDevMode()) {
      return devService();
    } else if (shouldLoadAnalytics()) {
      return analytics;
    } else {
      return noopService();
    }

    function shouldLoadAnalytics() {
      return load || $location.search().forceAnalytics;
    }

    function forceDevMode() {
      return $location.search().forceAnalyticsDevMode;
    }

    /**
     * Returns an object with the same interface as the proper
     * analytics service, except that all functions are replaced by
     * noops.
     */
    function noopService () {
      return _.mapValues(analytics, _.constant(_.noop));
    }

    /**
     * Similar to `noopService()`, but the track methods are replaced
     * with functions that log the events to the console. This is
     * helpful for debugging.
     */
    function devService () {
      return _.extend(analytics, {
        track: trackStub,
        trackTotango: trackStub,
        enable: _.noop,
        disable: _.noop
      });

      function trackStub (event, data) {
        console.log('track: ' + event, data);
      }
    }
  }];

}]);
