'use strict';

angular.module('contentful/test', [
  'ngAnimate',
  'ngSanitize',
  'contentful/environment',
  'timeRelative',
  'ui.sortable',
  'contentful/user_interface',
  'angularLoad',
  'contentful',
  'angularLoad',
  'contentful/mocks'
], ['$locationProvider', 'clientAdapterProvider', 'authenticationProvider', 'environment', '$sceDelegateProvider', '$compileProvider', 'timeRelativeConfig', 
  function($locationProvider, clientAdapterProvider, authenticationProvider, environment, $sceDelegateProvider, $compileProvider, timeRelativeConfig){
  var env = environment.settings;

  $locationProvider.html5Mode(true);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
  $sceDelegateProvider.resourceUrlWhitelist([/(https?:)?\/\/([^:\/.?&;]*\.)?(staticflinkly-thriventures\.netdna-ssl\.com|quirely.com|flinkly.com|joistio.com|contentful.com)(:\d+)?\/.*/, 'self' ]);
  clientAdapterProvider.server('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
  timeRelativeConfig.calendar.en.sameElse = 'll';
  timeRelativeConfig.calendar.en.lastWeek = 'ddd, LT';
  timeRelativeConfig.calendar.en.nextWeek = 'Next ddd, LT';
}]);
