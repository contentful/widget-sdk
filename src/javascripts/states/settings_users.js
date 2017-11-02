'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/users
 */
.factory('states/settings/users', ['require', function (require) {
  var base = require('states/base');

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
    abstract: true,
    children: [list]
  };
}]);
