'use strict';

angular.module('contentful')

.factory('segment', ['require', function (require) {
  var $window = require('$window');
  var $document = require('$document');
  var CallBuffer = require('CallBuffer');
  var environment = require('environment');
  var logger = require('logger');
  var analyticsConsole = require('analytics/console');

  var apiKey = dotty.get(environment, 'settings.segment_io');
  var buffer = new CallBuffer();
  var enabled;
  var noCommunication;

  return {
    enable: enable,
    disable: disable,
    page: bufferedSegmentCall('page'),
    identify: bufferedSegmentCall('identify'),
    track: bufferedSegmentCall('track')
  };

  function enable (shouldSend) {
    noCommunication = !shouldSend;

    if (enabled === undefined) {
      enabled = true;
      install();
      $window.analytics.load(apiKey);
      buffer.resolve();
    }
  }

  function disable () {
    enabled = false;
    buffer.disable();
  }

  function bufferedSegmentCall (fnName) {
    return function () {
      var args = arguments;
      buffer.call(function () {
        try {
          if (!noCommunication) {
            $window.analytics[fnName].apply($window.analytics, args);
          }
          if (fnName === 'track') {
            analyticsConsole.add(args[0], 'Segment', args[1]);
          }
        } catch (exp) {
          logger.logError('Failed analytics.js call', {
            data: {
              exp: exp,
              msg: exp.message,
              analyticsFn: fnName,
              analyticsFnArgs: _.toArray(args)
            }
          });
        }
      });
    };
  }

  // Copied from https://segment.com/docs/libraries/analytics.js/quickstart/#step-1-copy-the-snippet
  function install () {
    var document = $document[0];
    // Create a queue, but don't obliterate an existing one!
    var analytics = $window.analytics = $window.analytics || [];

    // If the real analytics.js is already on the page return.
    if (analytics.initialize) {
      return;
    }

    // If the snippet was invoked already show an error.
    if (analytics.invoked) {
      logger.logError('Segment snippet included twice.');
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
    analytics.factory = function (method) {
      return function () {
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
    analytics.load = function (key) {
      // Create an async script element based on your key.
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      var protocol = document.location.protocol === 'https:' ? 'https://' : 'http://';
      script.src = protocol + 'cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';

      // Insert our script next to the first script element.
      var first = document.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(script, first);
    };

    // Add a version to keep track of what's in the wild.
    analytics.SNIPPET_VERSION = '3.0.1';

    // According to segment's docs, we should call two more
    // methods, but we do it later:
    // - `load` is called when segment is being enabled
    // - `page` is called when the state changes
  }
}]);
