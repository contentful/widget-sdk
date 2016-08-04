'use strict';

/**
 * @ngdoc module
 * @name cf.app
 */
angular.module('cf.app', [
  'ui.router',
  'cf.utils',
  'cf.ui'
]);


/**
 * @ngdoc module
 * @name contentful
 */
angular.module('contentful', [
  'contentful/environment',
  'cf.libs',
  'cf.app',
  'cf.ui',
  'cf.forms',
  'cf.utils',
  'cf.data',
  'angularLoad',
  'ngAnimate',
  'ngSanitize',
  'ui.sortable',
  'ui.router',
  'ncy-angular-breadcrumb'
])
.config(['$locationProvider', 'authenticationProvider', 'environment', '$sceDelegateProvider', '$compileProvider', '$animateProvider',
  function($locationProvider, authenticationProvider, environment, $sceDelegateProvider, $compileProvider, $animateProvider){
  var env = environment.settings;

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  // This is not actually used but prevents gobbling of fragments in
  // the URL, like the authentication token passed by gatekeeper.
  $locationProvider.hashPrefix('!!!');

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
  $sceDelegateProvider.resourceUrlWhitelist(env.resourceUrlWhiteListRegexp);
  $animateProvider.classNameFilter(/animate/);
}]);
