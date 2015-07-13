'use strict';

/**
 * @ngdoc module
 * @name cf.ui
 * @description
 * Provides reusable UI components.
 */
angular.module('cf.ui', []);

angular.module('contentful', [
  'contentful/environment',
  'contentful/user_interface',
  'cf.ui',
  'cf.forms',
  'cf.utils',
  'angularLoad',
  'ngAnimate',
  'ngSanitize',
  'ui.sortable',
  'ui.router',
  'ncy-angular-breadcrumb',
  'monospaced.elastic'
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
