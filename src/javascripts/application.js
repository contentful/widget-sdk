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

.run(['$injector', function ($injector) {
  var get = $injector.get;
  var authentication = get('authentication');
  authentication.login();

  get('client').init(authentication.token);
  get('ShareJS').connect(authentication.token);
  get('uiVersionSwitcher').checkIfVersionShouldBeSwitched();
  get('navigation/stateChangeHandlers').setup();
  get('contextMenu').init();
  get('notification').setupClearMessageHooks();
  get('states').loadAll();
  get('dialogsInitController').init();
}]);
