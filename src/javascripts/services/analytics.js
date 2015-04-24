'use strict';

angular.module('contentful').provider('analytics', ['environment', function (environment) {
  var dontLoad = environment.env.match(/acceptance|development|test/) ? true : false;
  this.dontLoad  = function () { dontLoad = true;  };
  this.forceLoad = function () { dontLoad = false; };

  this.$get = [ '$injector', function ($injector) {
    var segment   = $injector.get('segment');
    var totango   = $injector.get('totango');
    var $location = $injector.get('$location');

    var analytics = {
      enable: function(){
        segment.enable();
        totango.enable();
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
          action: name
        });
      }
    };

    if (shouldLoadAnalytics()) {
      return analytics;
    } else {
      return _.mapValues(analytics, _.constant(_.noop));
    }

    function shouldLoadAnalytics() {
      return !(dontLoad && !$location.search().forceAnalytics);
    }
  }];

}]);
