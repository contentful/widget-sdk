'use strict';

angular.module('contentful').provider('analytics', function (environment) {
  var $window, $document, $q;
  var dontLoad = environment.env.match(/acceptance|development|test/) ? true : false;

  this.dontLoad = function () {
    dontLoad = true;
  };

  this.forceLoad = function () {
    dontLoad = false;
  };

  var totangoModuleNames = {
    apiKeys: 'API Keys',
    assets: 'Assets',
    contentTypes: 'Content Types',
    entries: 'Entries'
  };

  function injectAndLoadScript(path, onLoad) {
    var doc = $document.get(0);
    var script = doc.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = ('https:' === doc.location.protocol ? 'https://' : 'http://') + path;
    if(onLoad) script.onload = onLoad;

    // Find the first script element on the page and insert our script next to it.
    var firstScript = doc.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  function createAnalytics() {
    // Create a queue, but don't obliterate an existing one!
    $window.analytics = $window.analytics || [];

    $window.totango = {
      go: function(){return -1;},
      track: function(){},
      identify: function(){},
      setAccountAttributes: function(){}
    };

    $window.totango_options = {
      service_id: environment.settings.totango,
      allow_empty_accounts: false,
      account: {}
     };

    // Define a method that will asynchronously load analytics.js from our CDN.
    $window.analytics.load = function(apiKey) {

      injectAndLoadScript('d2dq2ahtl5zl1z.cloudfront.net/analytics.js/v1/' + apiKey + '/analytics.min.js');
      injectAndLoadScript('s3.amazonaws.com/totango-cdn/totango2.js', initializeTotango);

      // Define a factory that generates wrapper methods to push arrays of
      // arguments onto our `analytics` queue, where the first element of the arrays
      // is always the name of the analytics.js method itself (eg. `track`).
      var methodFactory = function (type) {
        return function () {
          $window.analytics.push([type].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };

      // Loop through analytics.js' methods and generate a wrapper method for each.
      var methods = ['identify', 'track', 'trackLink', 'trackForm', 'trackClick',
                     'trackSubmit', 'pageview', 'ab', 'alias', 'ready'];
      for (var i = 0; i < methods.length; i++) {
        $window.analytics[methods[i]] = methodFactory(methods[i]);
      }
    };

    // Load analytics.js with your API key, which will automatically load all of the
    // analytics integrations you've turned on for your account. Boosh!
    $window.analytics.load(environment.settings.segment_io);

    $window.analytics.ready(function () { // analytics.js object
      $window.ga('set', 'anonymizeIp', true);
    });
  }

  function initializeTotango() {
    $q.all([api._spaceDeferred.promise, api._userDeferred.promise]).then(function () {
      var orgId = api._organizationData ? api._organizationData.sys.id : 'noorg';
      $window.totango_options.username = api._userData.sys.id +'-'+ orgId;
      $window.totango_options.account.id = orgId;
      $window.totango_options.module = totangoModuleNames.entries;
      $window.totango.go($window.totango_options);
    });
  }

  var api = {
    disable: function () {
      this._disabled = true;
    },

    login: function(user){
      $window.analytics.identify(user.sys.id, {
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
        this._organizationData = space.data.organization;
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
        this._organizationData = null;
      }
      this._spaceDeferred.resolve(this._spaceData);
    },

    setUserData: function (user) {
      this._userData = user;
      this._userDeferred.resolve(this._userData);
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
      this._setTotangoModule(tab.section);
      this.track('Switched Tab', {
        viewType: tab.viewType,
        section: tab.section,
        id: this._idFromTab(tab),
        fromViewType: oldTab ? oldTab.viewType : null,
        fromSection: oldTab ? oldTab.section : null
      });
    },

    _setTotangoModule: function (sectionName) {
      if($window.totango_options){
        $window.totango_options.module = totangoModuleNames[sectionName];
      }
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
        $window.analytics.track(event, _.merge({},data, this._spaceData));
      }
      //console.log('analytics.track', event, data);
    }
  };

  this.$get = function (_$window_, _$document_, _$q_, $location) {
    $window = _$window_;
    $document = _$document_;
    $q = _$q_;
    api._spaceDeferred = $q.defer();
    api._userDeferred = $q.defer();
    if (dontLoad && !$location.search().forceAnalytics) {
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
