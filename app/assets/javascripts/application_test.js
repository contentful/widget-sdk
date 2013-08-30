//= require jquery
//= require lodash
//
//= require jquery.ui.sortable
//= require jquery.ui.autocomplete
//= require jquery.ui.datepicker
//
//= require jquery.autosize
//= require jquery.cookies.2.2.0
//
//= require guiders-1.3.0
//
//= require bootstrap-tooltip
//
//= require moment-2.1.0
//
//= require user_interface/node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed
//= require user_interface/node_modules/share/webclient/share.uncompressed
//= require user_interface/node_modules/share/webclient/json.uncompressed
//
//= require lib/bind_textarea
//
//= require hamlcoffee
//
//= require angular
//= require angular-route
//= require contentful
//= require environment
//= require ng-time-relative
//= require user_interface
//= require contentful_mocks
//
//= require_self

angular.module('contentful/test', [
  'contentful/environment',
  'timeRelative',
  'contentful/user_interface',
  'contentful',
  'contentful/mocks'
], function($locationProvider, clientProvider, authenticationProvider, environment, $sceDelegateProvider){
  'use strict';
  var env = environment.settings;
  $locationProvider.html5Mode(true);
  $sceDelegateProvider.resourceUrlWhitelist([ /flinkly.com|joistio.com|contentful.com(:\d+)?(\/|$)/, 'self' ]);
  clientProvider.endpoint('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
});
