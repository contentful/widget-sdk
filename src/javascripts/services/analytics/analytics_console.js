'use strict';

angular.module('contentful')

.run(['analytics/console', 'environment', function (c, env) {
  var whitelist = ['development', 'preview', 'staging'];
  if (_.includes(whitelist, dotty.get(env, 'env'))) {
    window.__ANALYTICS_CONSOLE = function () {
      c.show();
      return 'enjoy tracking! :wave:';
    };
  }
}])

.factory('analytics/console', ['require', function (require) {
  var $compile = require('$compile');
  var $rootScope = require('$rootScope');
  var moment = require('moment');

  var scope = _.extend($rootScope.$new(true), {events: [], hide: hide});
  var el = $compile('<cf-analytics-console />')(scope);

  return {show: show, hide: hide, add: add};

  function show () {
    var first = el[0];
    if (!first.parentElement) {
      document.body.appendChild(first);
    }

    scope.$apply(function () {
      scope.isVisible = true;
    });
  }

  function hide () {
    scope.isVisible = false;
  }

  function add (name, integration, data) {
    scope.events.push({
      name: name,
      time: moment().format('HH:mm:ss'),
      integration: integration,
      data: data
    });
  }
}])

.directive('cfAnalyticsConsole', [function () {
  return {
    template: JST.analytics_console(),
    link: function (scope, $el) {
      var $wrapper = $el.find('.analytics-console');
      var $events = $el.find('.analytics-console__events');

      var container = $events.get(0);
      scope.$watchCollection('events', function () {
        container.scrollTop = container.scrollHeight;
        $events.children().css({border: '1px dashed gray', padding: '5px'});
      });

      scope.$watch('isCollapsed', function (isCollapsed) {
        $events[isCollapsed ? 'hide' : 'show']();
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
