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
//= require angular-ui/sortable
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
  'ui.sortable',
  'contentful/user_interface',
  'contentful'
], ['$locationProvider', 'clientProvider', 'authenticationProvider', 'analyticsProvider', 'environment', '$sceDelegateProvider', '$compileProvider', 'timeRelativeConfig',
  function($locationProvider, clientProvider, authenticationProvider, analyticsProvider, environment, $sceDelegateProvider, $compileProvider, timeRelativeConfig){
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
  timeRelativeConfig.calendar.en.sameElse = 'll';
  timeRelativeConfig.calendar.en.lastWeek = 'ddd, LT';
  timeRelativeConfig.calendar.en.nextWeek = 'Next ddd, LT';
}]).run(['authentication', 'client', 'ShareJS', 'analytics', 'logger', function(authentication, client, ShareJS, analytics, logger) {
  'use strict';
  if(analytics.whenAnalyticsLoaded) analytics.whenAnalyticsLoaded.then(logger.onServiceReady);
  authentication.login();
  client.persistenceContext.adapter.token = authentication.token;
  ShareJS.connect();
}]);
