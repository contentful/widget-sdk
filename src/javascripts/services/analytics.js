'use strict';

angular.module('contentful').provider('analytics', ['environment', function (environment) {
  var dontLoad = environment.env.match(/acceptance|development|test/) ? true : false;

  this.dontLoad = function () {
    dontLoad = true;
  };

  this.forceLoad = function () {
    dontLoad = false;
  };

  this.$get = [ '$injector', function ($injector) {
    var segment   = $injector.get('segment');
    var totango   = $injector.get('totango');
    var $location = $injector.get('$location');

    if (shouldLoadAnalytics()) {
      segment.load();
      totango.load().then(function(){
        api._initializeTotango();
      });
      api._segment = segment;
      api._totango = totango;
      return api;
    } else {
      return _.mapValues(api, _.constant(_.noop));
    }

    function shouldLoadAnalytics() {
      return !(dontLoad && !$location.search().forceAnalytics);
    }
  }];

  var api = {
    login: function(user){
      this._segment.identify(user.sys.id, {
        firstName: user.firstName,
        lastName:  user.lastName
      });
      // TODO Move this check outside of the analytics.js
      if (user.features.logAnalytics === false) {
        this._disable();
        return;
      }
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
        this._initializeTotango();
      } else {
        this._spaceData = null;
        this._organizationData = null;
      }
    },

    setUserData: function (user) {
      this._userData = user;
      this._initializeTotango();
    },

    tabAdded: function (tab) {
      this.track('Opened Tab', {
        viewType: tab.viewType,
        section: tab.section,
        id: this._idFromTab(tab)
      });
      this._trackView(tab);
    },

    tabActivated: function (tab, oldTab) {
      this._totango.setSection(tab.section);
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

    tabClosed: function (tab) {
      this.track('Closed Tab', {
        viewType: tab.viewType,
        section: tab.section,
        id: this._idFromTab(tab)
      });
    },

    toggleAuxPanel: function (visible, tab) {
      var action = visible ? 'Opened Aux-Panel' : 'Closed Aux-Panel';
      this.track(action, {
        currentSection: tab.section,
        currentViewType: tab.viewType
      });
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
    },

    _disable: function(){
      _.forEach(this, function(value, key){
        this[key] = _.noop;
      }, this);
    },

    _initializeTotango: function(){
      if (this._userData && this._organizationData){
        this._totango.initialize(this._userData, this._organizationData);
      }
    },

    track: function (event, data) {
      this._segment.track(event, _.merge({}, data, this._spaceData));
    },

    trackTotango: function (event) {
      return this._totango.track(event);
    }
  };

}]);
