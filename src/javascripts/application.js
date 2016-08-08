'use strict';

/**
 * @ngdoc module
 * @name contentful/app
 */
angular.module('contentful/app', ['contentful'])

.config(['environment', '$compileProvider', function (environment, $compileProvider) {
  if (environment.env !== 'development') {
    $compileProvider.debugInfoEnabled(false);
  }
}])

.run(['require', function (require) {
  var authentication = require('authentication');
  authentication.login();

  require('presence').startTracking();
  require('client').init(authentication.token);
  require('uiVersionSwitcher').checkIfVersionShouldBeSwitched();
  require('navigation/stateChangeHandlers').setup();
  require('contextMenu').init();
  require('notification').setupClearMessageHooks();
  require('states').loadAll();
  require('dialogsInitController').init();
}]);
