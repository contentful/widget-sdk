'use strict';
angular.module('contentful').factory('segment', ['$injector', function($injector){
  var $window     = $injector.get('$window');
  var $document   = $injector.get('$document');
  var CallBuffer  = $injector.get('CallBuffer');
  var environment = $injector.get('environment');

  var apiKey = dotty.get(environment, 'settings.segment_io');

  var enabled;

  return {
    _buffer: new CallBuffer(),

    enable: function(){
      if (enabled === undefined) {
        enabled = true;
        install();
        $window.analytics.load(apiKey);
        this._buffer.resolve();
      }
    },

    disable: function(){
      enabled = false;
      this._buffer.disable();
    },

    identify: function(){
      var args = arguments;
      this._buffer.call(function(){
        $window.analytics.identify.apply($window.analytics, args);
      });
    },

    track: function(){
      var args = arguments;
      this._buffer.call(function(){
        $window.analytics.track.apply($window.analytics, args);
      });
    },

    page: function(){
      var args = arguments;
      this._buffer.call(function(){
        $window.analytics.page.apply($window.analytics, args);
      });
    },
  };

  // Copied from https://segment.com/docs/libraries/analytics.js/quickstart/#step-1-copy-the-snippet
  function install(){
    var document = $document[0];
    // Create a queue, but don't obliterate an existing one!
    var analytics = $window.analytics = $window.analytics || [];

    // If the real analytics.js is already on the page return.
    if (analytics.initialize) return;

    // If the snippet was invoked already show an error.
    if (analytics.invoked) {
      if ($window.console && console.error) {
        console.error('Segment snippet included twice.');
      }
      return;
    }

    // Invoked flag, to make sure the snippet
    // is never invoked twice.
    analytics.invoked = true;

    // A list of the methods in Analytics.js to stub.
    analytics.methods = [
      'trackSubmit',
      'trackClick',
      'trackLink',
      'trackForm',
      'pageview',
      'identify',
      'group',
      'track',
      'ready',
      'alias',
      'page',
      'once',
      'off',
      'on'
    ];

    // Define a factory to create stubs. These are placeholders
    // for methods in Analytics.js so that you never have to wait
    // for it to load to actually record data. The `method` is
    // stored as the first argument, so we can replay the data.
    analytics.factory = function(method){
      return function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method);
        analytics.push(args);
        return analytics;
      };
    };

    // For each of our methods, generate a queueing stub.
    for (var i = 0; i < analytics.methods.length; i++) {
      var key = analytics.methods[i];
      analytics[key] = analytics.factory(key);
    }

    // Define a method to load Analytics.js from our CDN,
    // and that will be sure to only ever load it once.
    analytics.load = function(key){
      // Create an async script element based on your key.
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';

      // Insert our script next to the first script element.
      var first = document.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(script, first);
    };

    // Add a version to keep track of what's in the wild.
    analytics.SNIPPET_VERSION = '3.0.1';

    // These two calls disabled in Contentful.
    // We know what we're doing

    // Load Analytics.js with your key, which will automatically
    // load the tools you've enabled for your account. Boosh!
    //analytics.load('YOUR_WRITE_KEY');

    // Make the first page call to load the integrations. If
    // you'd like to manually name or tag the page, edit or
    // move this call however you'd like.
    //analytics.page();
  }

}]);
