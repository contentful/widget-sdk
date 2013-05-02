'use strict';

angular.module('contentful/services').provider('analytics', function (environment) {
  // Create a queue, but don't obliterate an existing one!
  var analytics = window.analytics = window.analytics || [];

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
      login: function(user){
        analytics.identify(user.sys.id, {
          firstName: user.firstName,
          lastName:  user.lastName,
          plan: user.subscription.subscriptionPlan.name
        });
      },
      tabAdded: function (tab) {
        analytics.track('Tab added', {
          viewType: tab.viewType,
        });
      },
      tabActivated: function (tab) {
        analytics.track('Tab activated', {
          viewType: tab.viewType,
        });
      },
      tabClosed: function (tab) {
        analytics.track('Tab closed', {
          viewType: tab.viewType,
        });
      },
    };
  };
});
