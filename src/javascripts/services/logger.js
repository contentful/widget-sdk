'use strict';

/**
 * @ngdoc service
 * @name logger
 * @description
 * Log errors and exceptions to Bugsnag or the console.
 *
 * ~~~js
 * // error type: 'Logged Error',
 * // severity: 'error'
 * // and additional info
 * logger.logError('something happened', {
 *   error: { ... },
 *   data: { ... }
 * })
 * ~~~
 *
 * Each logging method defines the error type and severity and accepts
 * additional parameters.
 *
 * The `message` argument identifies the error and is used by Bugsnag
 * to group different logged events. It should be a short, descriptive
 * and constant string, that is an invocation of a logging call should
 * not interpolate the message.
 *
 * The `metaData` is an object where each key corresponds to a [tab in
 * Bugsnag][bugsnag-tab] in Bugsnag that displays the corresponding
 * value. The value may be an arbitrary JavaScript object. Note that
 * values are truncated to a maximal depth of three before sending
 * them.
 *
 * See the [Bugsnag documentation][bugsnag-doc] for more details.
 *
 * [bugsnag-tab]: https://bugsnag.com/docs/notifiers/js#metadata
 * [bugsnag-doc]: https://bugsnag.com/docs/notifiers/js
*/
angular.module('contentful')
.factory('logger', ['$injector', function ($injector) {
  var $window = $injector.get('$window');
  var bugsnag = $injector.get('bugsnag');
  var environment = $injector.get('environment');
  var stringifySafe = $injector.get('stringifySafe');

  function getParams () {
    var stateName = $injector.get('$state').current.name;
    var stateParams = $injector.get('$stateParams');
    return _.extend({
      state: stateName,
      viewport: '' + $window.innerWidth + 'x' + $window.innerHeight,
      screensize: '' + $window.screen.width + 'x' + $window.screen.height
    }, stateParams);
  }

  function augmentMetadata (metaData) {
    metaData = metaData || {};
    metaData.params = getParams();
    return _.mapValues(metaData, serializeObject);
  }

  /**
   * Given an aribtrary JS object returns a JSON object without `$$`
   * properties and circular references.
   */
  function serializeObject (obj) {
    return JSON.parse(stringifySafe(obj) || '{}', filterInternalProperties);
  }

  function filterInternalProperties (key, value) {
    if (key.substr(0, 2) === '$$') {
      return;
    } else {
      return value;
    }
  }

  function flattenServerErrors (err) {
    var flattened = dotty.get(err, 'body') || err;
    if (flattened.details && flattened.details.reasons) {
      flattened.reasons = _.clone(flattened.details.reasons);
      delete flattened.details.reasons;
    }
    var headers = dotty.get(flattened, 'error.request.headers');
    if (headers && headers.Authorization) {
      delete headers.Authorization;
    }
    return flattened;
  }

  return {
    /**
     * @ngdoc method
     * @name logger#enable
     * @description
     * Load bugsnag and set the user data.
     *
     * @param {API.User} user
     */
    enable: function (user) {
      bugsnag.enable(user);
    },

    /**
     * @ngdoc method
     * @name logger#disable
     * @description
     * Disables the logger service because of customers who wish to not have
     * any 3rd party services running
     */
    disable: function () {
      bugsnag.disable();
      _.forEach(this, function (value, key) {
        this[key] = _.noop;
      }, this);
    },

    /**
     * @ngdoc method
     * @name logger#logException
     * @description
     * Mostly used by the $uncaughtException service
     * @param {Error} exception  Exception Error object
     * @param {Object} metadata  Metadata object. Can take any of the expected bugsnag metadata parameters.
     * @param {Object} metadata.data  Additional data (other objects). Shows up on the bugsnag data tab.
     */
    logException: function (exception, metaData) {
      if (environment.env !== 'production' && environment.env !== 'unittest') {
        console.error(exception);
      }
      bugsnag.notifyException(exception, null, augmentMetadata(metaData), 'error');
    },

    /**
     * @ngdoc method
     * @name logger#logError
     * @description
     * Log with error level
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    logError: function (message, metaData) {
      this._log('Logged Error', 'error', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logWarn
     * @description
     * Log a warning to Bugsnag with the 'Logged Warning' title and the
     * given message.
     *
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
    */
    logWarn: function (message, metaData) {
      this._log('Logged Warning', 'warning', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logServerError
     * @description
     * Log an error from the Contentful API to Bugsnag.
     *
     * The Bugsnag title of the error will be 'Logged Server Error'.
     *
     * ~~~js
     * cfServerAPICall()
     * .then(handleSuccess)
     * .catch(function(error) {
     *   logger.logServerError('a server error', {error: error})
     * })
     * ~~~
     *
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    logServerError: function (message, metaData) {
      if (dotty.get(metaData, 'error.statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Error', 'error', message, flattenServerErrors(metaData));
      }
    },

    /**
     * @ngdoc method
     * @name logger#logServerWarn
     * @description
     * Log an error from the Contentful API with warn level
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    logServerWarn: function (message, metaData) {
      if (dotty.get(metaData, 'error.statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Warning', 'warning', message, flattenServerErrors(metaData));
      }
    },

    /**
     * @ngdoc method
     * @name logger#logSharejsError
     * @description
     * Log an error specific to ShareJS with error level
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    logSharejsError: function (message, metaData) {
      this._log('Logged ShareJS Error', 'error', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logSharejsWarn
     * @description
     * Log an error specific to ShareJS with warn level
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    logSharejsWarn: function (message, metaData) {
      this._log('Logged ShareJS Warning', 'warning', message, metaData);
    },

    /**
     * @name logger#_logCorsWarn
     * @description
     * Log detected CORS warnings
     * @param {string} message
     * @param {object} metadata        Can take any of the expected bugsnag metadata properties.
     * @param {object} metadata.data   Shows up on the bugsnag data tab.
     * @param {object} metadata.error  Shows up on the bugsnag error tab.
     */
    _logCorsWarn: function (message, metaData) {
      this._log('CORS Warning', 'warning', message, metaData);
    },

    /**
     * @name logger#_log
     * @description
     * Log a message to the bugsnag wrapper.
     * @param {String} type
     * @param {String} severity
     * @param {String} message
     * @param {Object} metadata
     * Additional info to show in bugsnag. Each key creates a tab that
     * displays the corresponding value.
    */
    _log: function (type, severity, message, metaData) {
      metaData = metaData || {};
      metaData.groupingHash = metaData.groupingHash || message;
      if (environment.env !== 'production' && environment.env !== 'unittest') {
        logToConsole(type, severity, message);
      }
      bugsnag.notify(type, message, augmentMetadata(metaData), severity);
    }
  };

  function logToConsole (type, severity, message) {
    message = type + ': ' + message;
    switch (severity) {
      case 'error':
        console.error(message);
        break;
      case 'warning':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }
}]);
