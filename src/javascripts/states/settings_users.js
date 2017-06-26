'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/users
 */
.factory('states/settings/users', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var list = base({
    name: 'list',
    url: '',
    label: 'Users',
    loadingText: 'Loading users...',
    template: '<cf-user-list class="workbench user-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  return {
    name: 'users',
    url: '/users',
    redirectTo: 'spaces.detail.settings.users.list',
    children: [list]
  };
}]);
