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

      setSpaceData: function (space) {
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

      tabAdded: function (tab) {
        this.track('Opened Tab', {
          viewType: tab.viewType,
          section: tab.section,
          id: this._idFromTab(tab)
        });
        this._trackView(tab);
      },

      tabClosed: function (tab) {
        this.track('Closed Tab', {
          viewType: tab.viewType,
          section: tab.section,
          id: this._idFromTab(tab)
        });
      },

      tabActivated: function (tab, oldTab) {
        totango.setSection(tab.section);
        this.track('Switched Tab', {
          viewType: tab.viewType,
          section: tab.section,
          id: this._idFromTab(tab),
          fromViewType: oldTab ? oldTab.viewType : null,
          fromSection: oldTab ? oldTab.section : null
        });
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

      toggleAuxPanel: function (visible, tab) {
        var action = visible ? 'Opened Aux-Panel' : 'Closed Aux-Panel';
        this.track(action, {
          currentSection: tab.section,
          currentViewType: tab.viewType
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

      _idFromTab: function (tab) {
        if (tab.viewType === 'entry-editor') {
          return tab.params.entry.getId();
        } else if (tab.viewType === 'asset-editor'){
          return tab.params.asset.getId();
        } else if (tab.viewType === 'content-type-editor'){
          return tab.params.contentType.getId();
        }
      },

      _trackView: function (tab) {
        var t = tab.viewType;
        if (t == 'entry-list') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType});
        } else if (t == 'content-type-list') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType});
        } else if (t == 'entry-editor') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType,
            entryId: tab.params.entry.getId()});
        } else if (t == 'content-type-editor') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType,
            entryId: tab.params.contentType.getId()});
        } else if (t == 'space-settings') {
          this.track('Viewed Page', {
            viewType: tab.viewType,
            pathSuffix: tab.params.pathSuffix
          });
        }
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
