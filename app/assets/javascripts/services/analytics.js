'use strict';

angular.module('contentful').provider('analytics', function (environment) {
  /*global analytics*/

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

  this.$get = function () {
    return {
      disable: function () {
        this._disabled = true;
      },
      login: function(user){
        this.setUserData(user);
        analytics.identify(user.sys.id, {
          firstName: user.firstName,
          lastName:  user.lastName,
          plan: user.subscription.subscriptionPlan.name
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
      setUserData: function (user) {
        this._userData = {
          userSubscriptionKey:                    user.subscription.sys.id,
          userSubscriptionState:                  user.subscription.state,
          userSubscriptionInvoiceState:           user.subscription.invoiceState,
          userSubscriptionSubscriptionPlanKey:    user.subscription.subscriptionPlan.sys.id,
          userSubscriptionSubscriptionPlanName:   user.subscription.subscriptionPlan.name
        };
      },
      setBucketData: function (bucket) {
        if (bucket) {
          this._bucketData = {
            bucketSubscriptionKey:                  bucket.data.subscription.sys.id,
            bucketSubscriptionState:                bucket.data.subscription.state,
            bucketSubscriptionInvoiceState:         bucket.data.subscription.invoiceState,
            bucketSubscriptionSubscriptionPlanKey:  bucket.data.subscription.subscriptionPlan.sys.id,
            bucketSubscriptionSubscriptionPlanName: bucket.data.subscription.subscriptionPlan.name
          };
        } else {
          this._bucketData = null;
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
      modifiedEntryType: function (event, entryType, field, action) {
        var data = {};
        if (entryType) {
          _.extend(data, {
            entryTypeId: entryType.getId(),
            entryTypeName: entryType.data.name
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
        } else if (tab.viewType === 'entry-type-editor'){
          return tab.params.entryType.getId();
        }
      },
      _trackView: function (tab) {
        var t = tab.viewType;
        if (t == 'entry-list') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType});
        } else if (t == 'entry-type-list') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType});
        } else if (t == 'entry-editor') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType,
            entryId: tab.params.entry.getId(),
            mode: tab.params.mode});
        } else if (t == 'entry-type-editor') {
          this.track('Viewed Page', {
            section: tab.section,
            viewType: tab.viewType,
            entryId: tab.params.entryType.getId(),
            mode: tab.params.mode});
        } else if (t == 'iframe') {
          var url = tab.params.url.replace(/access_token=(\w+)/, 'access_token=XXX');
          this.track('Viewed Page', {
            viewType: tab.viewType,
            url: url});
        }
      },
      track: function (event, data) {
        if (!this._disabled) {
          analytics.track(event, _.merge({},data, this._userData, this._bucketData));
        }
        //console.log('analytics.track', event, data);
      }
    };
  };
});
