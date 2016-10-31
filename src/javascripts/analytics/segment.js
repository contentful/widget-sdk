'use strict';

angular.module('contentful')

.factory('segment', ['require', function (require) {
  var $window = require('$window');
  var CallBuffer = require('CallBuffer');
  var LazyLoader = require('LazyLoader');
  var logger = require('logger');
  var analyticsConsole = require('analytics/console');

  var buffer = CallBuffer.create();
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
      install().then(function () {
        buffer.resolve();
      });
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

  // Adapted from the docs ("step 1" section):
  // https://segment.com/docs/sources/website/analytics.js/quickstart/
  function install () {
    var analytics = $window.analytics = $window.analytics || [];

    if (analytics.initialize) {
      return;
    }

    if (analytics.invoked) {
      logger.logError('Segment snippet included twice.');
      return;
    } else {
      analytics.invoked = true;
    }

    analytics.methods = [
      'trackSubmit',
      'trackClick',
      'trackLink',
      'trackForm',
      'pageview',
      'identify',
      'reset',
      'group',
      'track',
      'ready',
      'alias',
      'debug',
      'page',
      'once',
      'off',
      'on'
    ];

    analytics.factory = function (method) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method);
        analytics.push(args);
        return analytics;
      };
    };

    analytics.methods.forEach(function (key) {
      analytics[key] = analytics.factory(key);
    });

    analytics.load = _.noop;

    return LazyLoader.get('segment');
  }
}]);
