/*global angular:true*/
'use strict';

angular.module('docsApp', ['ui.router'])

.controller('NavController',
['$scope', '$location', '$state', 'MODULES_INDEX', 'PAGES',
function ($scope, $location, $state, MODULES_INDEX, PAGES) {
  loadNavigation();
  $scope.$root.$on('$stateChangeSuccess', loadNavigation);

  function loadNavigation () {
    if ($state.$current.name.indexOf('guides') === 0) {
      $scope.navPath = 'partials/guides-nav.html';
      $scope.guides  = PAGES;
    } else {
      $scope.navPath = 'partials/api-nav.html';
      $scope.modules  = MODULES_INDEX;
    }
  }
}])

.config(['$urlMatcherFactoryProvider', function ($urlMatcherFactory) {
  $urlMatcherFactory.strictMode(false);
}])

.directive('uiHrefActive', ['$location', function ($location) {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      function toggleActive () {
        var location = $location.path();
        var href = attrs.uiHrefActive || attrs.href;
        if (location.indexOf(href) === 1)
          elem.addClass('active');
        else
          elem.removeClass('active');
      }
      scope.$root.$on('$stateChangeSuccess', toggleActive);
      toggleActive();
    }
  };
}])

.config(['$urlRouterProvider', function($urlRouterProvider){
  $urlRouterProvider.when('/guides', '/guides/README');
  $urlRouterProvider.when('/', '/guides/README');
}])

.config(['$stateProvider', function ($stateProvider) {
  $stateProvider
  .state('api', {
    url: '/api',
    template: '<div class="api-profile" ui-view>' +
                // '<div ng-include="\'guides/api.html\'"></div>' +
              '</div>',
  })
  .state('api.doc', {
    url: '*path',
    templateUrl: function (params) {
      if (params.path === '')
        return 'guides/api.html';
      else
        return 'partials/api/' + params.path + '.html';
    }
  })
  .state('guides', {
    url: '/guides',
    template: '<div class="guide-profile" ui-view>' +
                '<div ng-include="contentPath"></div>' +
              '</div>',
  })
  .state('guides.doc', {
    url: '*path',
    templateUrl: function (params) {
      return 'guides/' + params.path + '.html';
    }
  });
}])

.config(['$sceProvider', function($sceProvider) {
  $sceProvider.enabled(false);
}])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
}]);
