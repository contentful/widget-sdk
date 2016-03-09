'use strict';

/**
 * @ngdoc module
 * @name cf.app
 */
angular.module('cf.app', ['ui.router']);


angular.module('contentful', [
  'contentful/environment',
  'cf.libs',
  'cf.app',
  'cf.ui',
  'cf.forms',
  'cf.utils',
  'cf.data',
  'angularLoad',
  'ngAnimate',
  'ngSanitize',
  'ui.sortable',
  'ui.router',
  'angular-bind-html-compile',
  'ncy-angular-breadcrumb'
])
.config(['$locationProvider', 'clientAdapterProvider', 'authenticationProvider', 'environment', '$sceDelegateProvider', '$compileProvider',
  function($locationProvider, clientAdapterProvider, authenticationProvider, environment, $sceDelegateProvider, $compileProvider){
  var env = environment.settings;

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  }).hashPrefix('!');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
  $sceDelegateProvider.resourceUrlWhitelist(env.resourceUrlWhiteListRegexp);
  clientAdapterProvider.server('//'+env.api_host);
}])

.run(['$injector', function ($injector) {
  if (window.CF_ENV === 'unittest') {
    return;
  }

  $injector.get('navigation/stateChangeHandlers').setup();
  $injector.get('contextMenu').init();
  $injector.get('notification').setupClearMessageHooks();
  $injector.get('TrialWatcher').init();
  $injector.get('activationEmailResendController').init();
}]);
