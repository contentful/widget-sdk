'use strict';

angular.module('contentful')

.factory('segment', ['require', function (require) {
  var $window = require('$window');
  var $q = require('$q');
  var CallBuffer = require('CallBuffer');
  var LazyLoader = require('LazyLoader');
  var logger = require('logger');

  var INTEGRATIONS = {
    All: false,
    Mixpanel: false,
    'Google Analytics': true
  };

  var buffer = CallBuffer.create();
  var bufferedTrack = bufferedCall('track');

  var API = {
    enable: _.once(enable),
    disable: disable,
    track: track,
    page: bufferedCall('page'),
    identify: bufferedCall('identify')
  };

  return API;

  function enable () {
    install().then(buffer.resolve);
  }

  function disable () {
    buffer.disable();
    API.enable = _.noop;
  }

  function track (event, data) {
    bufferedTrack(event, data, INTEGRATIONS);
  }

  function bufferedCall (fnName) {
    return function () {
      var args = _.toArray(arguments);
      buffer.call(function () {
        try {
          $window.analytics[fnName].apply($window.analytics, args);
        } catch (err) {
          logger.logError('Failed Segment call', {
            err: err,
            msg: err.message,
            analyticsFn: fnName,
            analyticsFnArgs: args
          });
        }
      });
    };
  }

  // Adapted from the docs ("step 1" section):
  // https://segment.com/docs/sources/website/analytics.js/quickstart/
  function install () {
    var analytics = $window.analytics = $window.analytics || [];

    if (analytics.initialize || analytics.invoked) {
      return $q.reject();
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
        var args = _.toArray(arguments);
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
