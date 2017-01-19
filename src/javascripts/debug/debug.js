'use strict';

angular.module('contentful')

.run(['require', function (require) {
  var env = require('environment').env;

  var CONSOLE_ENVS = ['development', 'preview', 'staging'];
  var CONSOLES = {
    '__ANALYTICS_CONSOLE': 'analytics/console',
    '__MOCK_XHR': 'debug/mock_xhr/MockXhrConsole'
  };

  if (_.includes(CONSOLE_ENVS, env)) {
    Object.keys(CONSOLES).forEach(function (key) {
      var c = require(CONSOLES[key]);
      if (key === '__ANALYTICS_CONSOLE') {
        // @todo
        c.enable();
      }
      window[key] = c.show;
    });
  }

}]);
