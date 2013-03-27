//= require jquery
//= require lodash
//
//= require jquery.ui.sortable
//= require jquery.ui.autocomplete
//= require jquery.ui.datepicker
//
//= require jquery.cookies.2.2.0
//
//= require moment-1.7.2
//
//= require bcsocket-uncompressed
//= require share/share.uncompressed
//= require share/json.uncompressed
//
//= require lib/bind_textarea
//
//= require hamlcoffee
//= require_tree ./templates
//
//= require angular-1.0.4
//= require environment
//= require services
//= require controllers
//= require filters
//= require directives
//= require classes
//
//= require user_interface
//
//= require_self

angular.module('contentful', [
  'contentful/environment',
  'contentful/classes',
  'contentful/user_interface',
  'contentful/services',
  'contentful/controllers',
  'contentful/directives',
  'contentful/filters'
], function($locationProvider, clientProvider, authenticationProvider, environment){
  'use strict';
  var env = environment.settings;
  $locationProvider.html5Mode(true);
  clientProvider.endpoint('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
}).run(function(authentication, client) {
  'use strict';
  authentication.login();
  client.persistenceContext.adapter.token = authentication.token;
});

angular.bootstrap(document, ['contentful']);
