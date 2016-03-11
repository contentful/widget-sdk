'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/users
 */
.factory('states/settings/users', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var list = base({
    name: '.list',
    url: '',
    ncyBreadcrumb: { label: 'Users' },
    loadingText: 'Loading Users...',
    template: '<cf-user-list class="workbench user-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  return {
    name: '.users',
    url: '/users',
    abstract: true,
    template: '<ui-view />',
    children: [list]
  };
}]);
