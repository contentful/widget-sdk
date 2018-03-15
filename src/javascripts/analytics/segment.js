'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name analytics/segment
 * @description
 * The segment.com client service.
 *
 * All calls (`track`, `page`, `identify`)
 * are buffered and executed after `enable`
 * call. Once disabled, this service cannot
 * be enabled again.
 */
.factory('analytics/segment', ['require', function (require) {
  var $window = require('$window');
  var $q = require('$q');
  var CallBuffer = require('utils/CallBuffer');
  var LazyLoader = require('LazyLoader');
  var logger = require('logger');

  /**
   * Our intercom setup doesn't care about
   * `track()` events sent from UI and it has
   * a limit of 120 unique event names.
   *
   * We forcefully disable this integration
   * here so we won't get exceptions in the
   * dev tools.
   */
  var TRACK_INTEGRATIONS = {
    Intercom: false
  };

  var buffer = CallBuffer.create();
  var bufferedTrack = bufferedCall('track');
  var isDisabled = false;

  return {
    enable: _.once(enable),
    disable: disable,
    /**
     * @ngdoc method
     * @name analytics/segment#track
     * @param {string} event
     * @param {object} data
     * @description
     * Sends a single event with data to
     * the selected integrations.
     */
    track: function track (event, data) {
      bufferedTrack(event, data, {integrations: TRACK_INTEGRATIONS});
    },
    /**
     * @ngdoc method
     * @name analytics/segment#page
     * @param {string} pageName
     * @param {object} pageData
     * @description
     * Sets current page.
     */
    page: bufferedCall('page'),
    /**
     * @ngdoc method
     * @name analytics/segment#identify
     * @param {string} userId
     * @param {object} userTraits
     * @description
     * Sets current user traits.
     */
    identify: bufferedCall('identify')
  };

  /**
   * @ngdoc method
   * @name analytics/segment#enable
   * @description
   * Loads lazily the script and starts
   * sending analytical events.
   */
  function enable () {
    if (!isDisabled) {
      install().then(buffer.resolve);
    }
  }

  /**
   * @ngdoc method
   * @name analytics/segment#disable
   * @description
   * Stops sending analytical events and
   * blocks next calls to `enable`.
   */
  function disable () {
    buffer.disable();
    isDisabled = true;
  }

  function bufferedCall (fnName) {
    return function () {
      var args = _.toArray(arguments);
      buffer.call(function (analytics) {
        try {
          analytics[fnName].apply(analytics, args);
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
