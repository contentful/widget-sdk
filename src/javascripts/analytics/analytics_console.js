'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name analytics/console
 * @description
 * A small UI component presenting all events being tracked. Can be
 * turned on (not in production) by calling `cfDebug.analytics()` from
 * the console
 *
 * TODO We should invert the dependencies. Currently the 'Analytics'
 * module requires this module and uses 'add()' and 'setSessionData()'
 * to interact with the console. Instead this module should require
 * 'Analytics' and use an event stream provided by the 'Analytics'
 * module.
 */
.factory('analytics/console', ['require', function (require) {
  var $compile = require('$compile');
  var $rootScope = require('$rootScope');
  var moment = require('moment');
  var K = require('utils/kefir');
  var validateEvent = require('analytics/Validator').validateEvent;
  var logger = require('logger');
  var buildSnowplowEvent = require('analytics/snowplow/Snowplow').buildUnstructEventData;
  var getSnowplowSchema = require('analytics/snowplow/Events').getSchema;

  var isEnabled = false;
  var el = null;

  var eventsBus = K.createBus();
  var sessionDataBus = K.createPropertyBus();

  var events$ = eventsBus.stream.scan(function (events, newEvent) {
    return events.concat([newEvent]);
  }, []);
  events$.onValue(_.noop);

  var scope = _.extend($rootScope.$new(true), {
    events$: events$,
    sessionData$: sessionDataBus.property
  });

  return {
    /**
     * @ngdoc method
     * @name analytics/console#default
     * @description
     * Enables and opens the console.
     *
     * After this we record events send from the analytics service.
     *
     * Mocks ES6 default export. Used by 'Debug' module to initialize
     * service.
     */
    default: function () {
      isEnabled = true;
      show();
    },

    add: add,
    /**
     * @ngdoc method
     * @name analytics/console#setUserData
     * @param {object} data
     * @description
     * Replaces current session data.
     */
    setSessionData: sessionDataBus.set
  };

  /**
   * @ngdoc method
   * @name analytics/console#show
   * @returns {string|undefined}
   * @description
   * Activates the console.
   */
  function show () {
    el = el || $compile('<cf-analytics-console />')(scope);
    var first = el[0];
    if (!first.parentElement) {
      document.body.appendChild(first);
    }

    scope.$applyAsync(function () {
      scope.isVisible = true;
    });

    return 'enjoy tracking! :wave:';
  }

  /**
   * @ngdoc method
   * @name analytics/console#add
   * @param {string} name
   * @param {object?} data
   * @description
   * Adds an event to the console.
   */
  function add (name, data) {
    var snowplowEvent = buildSnowplowEvent(name, data);

    var event = {
      time: moment().format('HH:mm:ss'),
      name: name,
      data: data,
      isValid: validateEvent(name)
    };

    if (snowplowEvent) {
      var snowplowSchema = getSnowplowSchema(name);

      event.snowplow = {
        name: snowplowSchema.name,
        version: snowplowSchema.version,
        data: snowplowEvent[1],
        context: snowplowEvent[2]
      };
    }

    eventsBus.emit(event);
    throwOrLogInvalidEvent(event);
  }

  function throwOrLogInvalidEvent (event) {
    if (event.isValid) {
      return;
    }

    var message = 'Invalid analytical event name: ' + event.name;
    if (isEnabled) {
      throw new Error(message);
    } else {
      logger.logWarn(message, {data: {event: event}});
    }
  }
}])

.directive('cfAnalyticsConsole', ['require', function (require) {
  var $timeout = require('$timeout');

  return {
    template: JST.analytics_console(),
    link: function (scope, $el) {
      var containerEl = $el.find('.analytics-console__content').get(0);

      scope.toggleSessionData = function () {
        scope.showingSnowplowDebugInfo = false;
        scope.showSessionData = !scope.showSessionData;

        if (scope.showSessionData) {
          scrollUp();
        } else {
          scrollDown();
        }
      };

      scope.toggleSnowplowDebugInfo = function () {
        scope.showSessionData = false;
        scope.showingSnowplowDebugInfo = !scope.showingSnowplowDebugInfo;

        if (scope.showingSnowplowDebugInfo) {
          scrollDown();
        }
      };

      scope.events$.onValue(function (events) {
        scope.events = events;
        if (!scope.showSessionData) {
          scrollDown();
        }
      });

      scope.sessionData$.onValue(function (data) {
        scope.sessionData = data;
      });

      function scrollDown () {
        $timeout(function () {
          containerEl.scrollTop = containerEl.scrollHeight;
        });
      }

      function scrollUp () {
        $timeout(function () {
          containerEl.scrollTop = 0;
        });
      }
    }
  };
}]);
