'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 *
 * This service provides an object with different methods to trigger
 * analytics events.
 *
 * The service is disabled in all but the production environment. It
 * can be enabled by appending the '?forceAnalytics' query string to
 * the URL. In the development environment this will still keep the
 * SegmentIO and Totango services disabled but send all tracking
 * events to the console.
 */
angular.module('contentful')
.provider('analytics', ['environment', function (environment) {
  var load = !environment.env.match(/acceptance|development|preview|test/);
  this.dontLoad  = function () { load = false;  };
  this.forceLoad = function () { load = true; };

  this.$get = [ '$injector', function ($injector) {
    var $location = $injector.get('$location');

    var segment     = $injector.get('segment');
    var totango     = $injector.get('totango');
    var fontsdotcom = $injector.get('fontsdotcom');

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
          this._organizationData = space.data.organization;
          this._spaceData = {
            spaceIsTutorial:                       space.data.tutorial,
            spaceSubscriptionKey:                  space.data.organization.sys.id,
            spaceSubscriptionState:                space.data.organization.subscriptionState,
            spaceSubscriptionInvoiceState:         space.data.organization.invoiceState,
            spaceSubscriptionSubscriptionPlanKey:  space.data.organization.subscriptionPlan.sys.id,
            spaceSubscriptionSubscriptionPlanName: space.data.organization.subscriptionPlan.name
          };
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
       *
       * @param {string} event
       * @param {{}} data
       */
      track: function (event, data) {
        segment.track(event, _.merge({}, data, this._spaceData));
      },

      trackTotango: function (event) {
        return totango.track(event);
      },

      knowledgeBase: function (section) {
        this.track('Clicked KBP link', {
          section: section
        });
      },

      modifiedContentType: function (event, contentType, field, action) {
        var data = {};
        if (contentType) {
          _.extend(data, {
            contentTypeId: contentType.getId(),
            contentTypeName: contentType.getName()
          });
        }
        if (field) {
          _.extend(data, {
            fieldId: field.id,
            fieldName: field.name,
            fieldType: field.type,
            fieldSubtype: dotty.get(field, 'items.type') || null,
            fieldLocalized: field.localized,
            fieldRequired: field.required
          });
        }
        if (action) {
          data.action = action;
        }
        this.track(event, data);
      },

      toggleAuxPanel: function (visible, stateName) {
        var action = visible ? 'Opened Aux-Panel' : 'Closed Aux-Panel';
        this.track(action, {
          currentState: stateName
        });
      },

      _initialize: function(){
        if (this._userData) {
          segment.identify(this._userData.sys.id, {
            firstName: this._userData.firstName,
            lastName:  this._userData.lastName
          });
        }
        if (this._userData && this._organizationData){
          totango.initialize(this._userData, this._organizationData);
        }
      },

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

    if (shouldLoadAnalytics()) {
      if (environment.env == 'development')
        return devService();
      else
        return analytics;
    } else {
      return noopService();
    }

    function shouldLoadAnalytics() {
      return load || $location.search().forceAnalytics;
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
     * Simliar to `noopService()`, but the track methods are replaced
     * with functions that log the events to the console. This is
     * helpful for debugging.
     */
    function devService () {
      return _.extend(noopService(), {
        track: trackStub,
        trackTotango: trackStub,
      });

      function trackStub (event, data) {
        console.log('track: ' + event, data);
      }
    }
  }];

}]);
