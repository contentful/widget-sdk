'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name analytics/console
 * @description
 * A small UI component presenting all events
 * being tracked. Can be turned on (not in
 * production) by invoking a global function
 * `window.__ANALYTICS_CONSOLE` (see the `run`
 * block above).
 */
.factory('analytics/console', ['require', function (require) {
  var $compile = require('$compile');
  var $rootScope = require('$rootScope');
  var moment = require('moment');
  var K = require('utils/kefir');
  var validateEvent = require('analytics/validateEvent');
  var logger = require('logger');

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
     * @name analytics/console#enable
     * @description
     * Enables the console. W/o this call
     * the console cannot be opened. It's
     * called when we're in an environment
     * where it's safe to expose dev data.
     */
    enable: function () { isEnabled = true; },
    show: show,
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
    if (!isEnabled) {
      return;
    }

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
    var event = {
      time: moment().format('HH:mm:ss'),
      name: name,
      data: data,
      isValid: validateEvent(name)
    };

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

      scope.toggle = function () {
        scope.showSessionData = !scope.showSessionData;
        if (scope.showSessionData) {
          scrollUp();
        } else {
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
