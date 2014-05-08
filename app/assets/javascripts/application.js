//= require jquery
//
//= require jquery.ui.sortable
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
//= require contentful
//= require environment
//= require user_interface
//
//= require_self

angular.module('contentful/app', [
  'ngAnimate',
  'ngSanitize',
  'contentful/environment',
  'timeRelative',
  'contentful/user_interface',
  'contentful'
], function($locationProvider, clientProvider, authenticationProvider, analyticsProvider, environment, $sceDelegateProvider, $compileProvider){
  'use strict';
  var env = environment.settings;

  $.cookies.setOptions({
    secure: environment.env != 'development'
  });

  if (!history.pushState) {
    // Strip invalid hash so $location does not trip up
    // when we call the page with #access_token=foo
    if (window.location.hash.match(/^#(?:$|[^!])|^$/)) {
      window.location.hash = '!/' + window.location.hash;
    }
  }

  $locationProvider.html5Mode(true).hashPrefix('!');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
  $sceDelegateProvider.resourceUrlWhitelist(env.resourceUrlWhiteListRegexp);
  clientProvider.endpoint('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
  //analyticsProvider.forceLoad();
}).run(function(authentication, client, ShareJS) {
  'use strict';
  authentication.login();
  client.persistenceContext.adapter.token = authentication.token;
  ShareJS.connect();
});
