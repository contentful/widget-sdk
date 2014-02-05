'use strict';

angular.module('contentful').provider('analytics', function (environment) {
  /*global analytics*/

  var dontLoad = environment.env.match(/acceptance|development|test/) ? true : false;

  this.dontLoad = function () {
    dontLoad = true;
  };

  this.forceLoad = function () {
    dontLoad = false;
  };


  function createAnalytics() {
    // Create a queue, but don't obliterate an existing one!
    window.analytics = window.analytics || [];

    // Define a method that will asynchronously load analytics.js from our CDN.
    analytics.load = function(apiKey) {

      // Create an async script element for analytics.js.
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = ('https:' === document.location.protocol ? 'https://' : 'http://') +
                    'd2dq2ahtl5zl1z.cloudfront.net/analytics.js/v1/' + apiKey + '/analytics.min.js';

      // Find the first script element on the page and insert our script next to it.
      var firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);

      // Define a factory that generates wrapper methods to push arrays of
      // arguments onto our `analytics` queue, where the first element of the arrays
      // is always the name of the analytics.js method itself (eg. `track`).
      var methodFactory = function (type) {
        return function () {
          analytics.push([type].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };

      // Loop through analytics.js' methods and generate a wrapper method for each.
      var methods = ['identify', 'track', 'trackLink', 'trackForm', 'trackClick',
                     'trackSubmit', 'pageview', 'ab', 'alias', 'ready'];
      for (var i = 0; i < methods.length; i++) {
        analytics[methods[i]] = methodFactory(methods[i]);
      }
    };

    // Load analytics.js with your API key, which will automatically load all of the
    // analytics integrations you've turned on for your account. Boosh!
    analytics.load(environment.settings.segment_io);

    analytics.ready(function () { // analytics.js object
      window.ga('set', 'anonymizeIp', true);
    });
  }

  var api = {
    disable: function () {
      this._disabled = true;
    },

    login: function(user){
      analytics.identify(user.sys.id, {
        firstName: user.firstName,
        lastName:  user.lastName
      }, {
        intercom: {
          user_hash: user.intercomUserHash
        }
      });
      if (user.features.logAnalytics === false) {
        this.disable();
        return;
      }
    },

    setSpaceData: function (space) {
      if (space) {
        this._spaceData = {
          spaceIsTutorial:                       space.data.tutorial,
          spaceSubscriptionKey:                  space.data.organization.sys.id,
          spaceSubscriptionState:                space.data.organization.subscriptionState,
          spaceSubscriptionInvoiceState:         space.data.organization.invoiceState,
          spaceSubscriptionSubscriptionPlanKey:  space.data.organization.subscriptionPlan.sys.id,
          spaceSubscriptionSubscriptionPlanName: space.data.organization.subscriptionPlan.name
        };
      } else {
        this._spaceData = null;
      }
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
          fieldSubtype: field.items ? field.items.type : null,
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

    track: function (event, data) {
      if (!this._disabled) {
        analytics.track(event, _.merge({},data, this._spaceData));
      }
      //console.log('analytics.track', event, data);
    }
  };

  this.$get = function () {
    if (dontLoad) {
      return _.reduce(api, function (api, fun, name) {
        api[name] = angular.noop;
        return api;
      }, {});
    } else {
      createAnalytics();
      return api;
    }
  };

});
