'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/learn
 */
.factory('states/learn', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  return base({
    name: 'learn',
    url: '/learn',
    ncyBreadcrumb: {label: 'Learn'},
    template: '<cf-learn-view />',
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });
}]);
