//= require jquery
//
//= require jquery.ui.sortable
//= require jquery.ui.draggable
//= require jquery.ui.autocomplete
//= require jquery.ui.datepicker
//
//= require jquery.autosize
//= require jquery.cookies.2.2.0
//= require jquery-textrange
//
//= require guiders-1.3.0
//
//= require bootstrap-tooltip
//
//= require user_interface/node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed
//= require user_interface/node_modules/share/webclient/share.uncompressed
//= require user_interface/node_modules/share/webclient/json.uncompressed
//= require user_interface/node_modules/share/webclient/textarea.js
//
//= require hamlcoffee
//
//= require angular
//= require angular-animate
//= require angular-sanitize
//= require angular-route
//= require angular-ui/sortable
//= require angular-load
//= require contentful
//= require environment
//= require user_interface
//= require contentful_mocks
//
//= require_self

angular.module('contentful/test', [
  'ngAnimate',
  'ngSanitize',
  'contentful/environment',
  'timeRelative',
  'ui.sortable',
  'contentful/user_interface',
  'angularLoad',
  'contentful',
  'contentful/mocks'
], ['$locationProvider', 'clientAdapterProvider', 'authenticationProvider', 'environment', '$sceDelegateProvider', '$compileProvider', 'timeRelativeConfig', 
  function($locationProvider, clientAdapterProvider, authenticationProvider, environment, $sceDelegateProvider, $compileProvider, timeRelativeConfig){
  'use strict';
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
