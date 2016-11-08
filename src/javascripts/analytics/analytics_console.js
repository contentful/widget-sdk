'use strict';

angular.module('contentful')

.run(['require', function (require) {
  var env = require('environment').env;

  var CONSOLE_ENVS = ['development', 'preview', 'staging'];
  var FN_NAME = '__ANALYTICS_CONSOLE';

  if (_.includes(CONSOLE_ENVS, env)) {
    window[FN_NAME] = require('analytics/console').show;
  }
}])

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

  var events = [];
  var eventsBus = null;
  var sessionData = {};
  var sessionDataBus = null;
  var scope = null;
  var el = null;

  return {
    show: show,
    add: add,
    setSessionData: setSessionData
  };

  /**
   * @ngdoc method
   * @name analytics/console#show
   * @returns {string} nice message > `undefined`
   * @description
   * Activates the console.
   */
  function show () {
    if (!scope) {
      eventsBus = K.createPropertyBus(events);
      sessionDataBus = K.createPropertyBus(sessionData);
      scope = _.extend($rootScope.$new(true), {
        eventsProperty: eventsBus.property,
        sessionDataProperty: sessionDataBus.property
      });
      el = $compile('<cf-analytics-console />')(scope);
    }

    var first = el[0];
    if (!first.parentElement) {
      document.body.appendChild(first);
    }

    scope.$apply(function () {
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
    events.push({
      time: moment().format('HH:mm:ss'),
      name: name,
      data: data
    });

    if (eventsBus) {
      eventsBus.set(events);
    }
  }

  /**
   * @ngdoc method
   * @name analytics/console#setUserData
   * @param {object} data
   * @description
   * Replaces current session data.
   */
  function setSessionData (data) {
    sessionData = data;
    if (sessionDataBus) {
      sessionDataBus.set(data);
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

      scope.eventsProperty.onValue(function (events) {
        scope.events = events;
        if (!scope.showSessionData) {
          scrollDown();
        }
      });

      scope.sessionDataProperty.onValue(function (data) {
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
