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
//= require moment-1.7.2
//
//= require user_interface/node_modules/share/node_modules/browserchannel/dist/bcsocket-uncompressed
//= require user_interface/node_modules/share/webclient/share.uncompressed
//= require user_interface/node_modules/share/webclient/json.uncompressed
//
//= require lib/bind_textarea
//
//= require hamlcoffee
//= require_tree ./templates
//
//= require angular-1.0.4
//= require contentful
//= require environment
//= require ng-time-relative
//= require user_interface
//
//= require_self

angular.module('contentful/app', [
  'contentful/environment',
  'timeRelative',
  'contentful/user_interface',
  'contentful'
], function($locationProvider, clientProvider, authenticationProvider, environment){
  'use strict';
  var env = environment.settings;
  $locationProvider.html5Mode(!!history.pushState).hashPrefix('!');
  clientProvider.endpoint('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
}).run(function(authentication, client) {
  'use strict';
  authentication.login();
  client.persistenceContext.adapter.token = authentication.token;
});

angular.bootstrap(document, ['contentful/app']);
