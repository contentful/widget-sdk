'use strict';

angular.module('contentful', [
  'contentful/environment',
  'contentful/user_interface',
  'angularLoad',
  'ngAnimate',
  'ngRoute',
  'ngSanitize',
  'timeRelative',
  'ui.sortable',
])
.config(['$locationProvider', 'clientAdapterProvider', 'authenticationProvider', 'environment', '$sceDelegateProvider', '$compileProvider', 'timeRelativeConfig',
  function($locationProvider, clientAdapterProvider, authenticationProvider, environment, $sceDelegateProvider, $compileProvider, timeRelativeConfig){
  var env = environment.settings;

  $locationProvider.html5Mode(true).hashPrefix('!');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
  $sceDelegateProvider.resourceUrlWhitelist(env.resourceUrlWhiteListRegexp);
  clientAdapterProvider.server('//'+env.api_host);

  timeRelativeConfig.calendar.en.sameElse = 'll';
  timeRelativeConfig.calendar.en.lastWeek = 'ddd, LT';
  timeRelativeConfig.calendar.en.nextWeek = 'Next ddd, LT';
}]);
