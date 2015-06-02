'use strict';

angular.module('contentful', [
  'contentful/environment',
  'contentful/user_interface',
  'angularLoad',
  'ngAnimate',
  'ngSanitize',
  'ui.sortable',
  'ui.router',
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
}]);
