'use strict';

angular.module('contentful')

.run(['require', function (require) {
  var env = require('environment').env;
  var CONSOLE_ENVS = ['development', 'preview', 'staging'];

  if (_.includes(CONSOLE_ENVS, env)) {
    var showConsole = require('analytics/console').show;
    window.__ANALYTICS_CONSOLE = showConsole;
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

  var events = [];
  var scope = null;
  var el = null;

  return {show: show, add: add};

  /**
   * @ngdoc method
   * @name analytics/console#show
   * @returns {string} nice message > `undefined`
   * @description
   * Activates the console.
   */
  function show () {
    if (!scope) {
      scope = _.extend($rootScope.$new(true), {events: events});
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
   * @param {string} integration
   * @param {object?} data
   * @description
   * Adds an event to the console.
   */
  function add (name, integration, data) {
    events.push({
      name: name,
      time: moment().format('HH:mm:ss'),
      integration: integration,
      data: data
    });
  }
}])

.directive('cfAnalyticsConsole', ['require', function (require) {
  var $timeout = require('$timeout');

  return {
    template: JST.analytics_console(),
    link: function (scope, $el) {
      var $wrapper = $el.find('.analytics-console');
      var $events = $el.find('.analytics-console__events');

      var container = $events.get(0);
      scope.$watchCollection('events', function () {
        $timeout(function () {
          container.scrollTop = container.scrollHeight;
          $events.children().css({border: '1px dashed gray', padding: '5px'});
        });
      });

      $wrapper.css({
        position: 'absolute',
        width: '350px',
        border: '2px solid black',
        right: '20px',
        bottom: '20px',
        background: 'white'
      });

      $events.css({
        height: '350px',
        'overflow-y': 'scroll',
        padding: '15px'
      });
    }
  };
}]);
