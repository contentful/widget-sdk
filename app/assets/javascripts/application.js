'use strict';

angular.module('contentful/app', [
  'ngAnimate',
  'ngSanitize',
  'contentful/environment',
  'timeRelative',
  'ui.sortable',
  'contentful/user_interface',
  'angularLoad',
  'contentful'
], ['$locationProvider', 'clientAdapterProvider', 'authenticationProvider', 'analyticsProvider', 'environment', '$sceDelegateProvider', '$compileProvider', 'timeRelativeConfig',
  function($locationProvider, clientAdapterProvider, authenticationProvider, analyticsProvider, environment, $sceDelegateProvider, $compileProvider, timeRelativeConfig){
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
  clientAdapterProvider.server('//'+env.api_host);
  authenticationProvider.authApp('//'+env.base_host+'/');
  //analyticsProvider.forceLoad();
  timeRelativeConfig.calendar.en.sameElse = 'll';
  timeRelativeConfig.calendar.en.lastWeek = 'ddd, LT';
  timeRelativeConfig.calendar.en.nextWeek = 'Next ddd, LT';
}]).run(['authentication', 'client', 'ShareJS', 'analytics', 'logger', function(authentication, client, ShareJS, analytics, logger) {
  authentication.login();
  client.persistenceContext.adapter.token = authentication.token;
  // FIXME when the custom tab issue gets fixed on Segment.io, use this again
  //if(analytics.whenAnalyticsLoaded) analytics.whenAnalyticsLoaded.then(logger.onServiceReady);
  logger.onServiceReady();
  ShareJS.connect();
}]);
