'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfUserRoleSelector
 */
.directive('cfUserRoleSelector', ['require', function (require) {
  return {
    restrict: 'E',
    bindings: {
      users: '=',
      roleOptions: '=',
      selectedRoles: '=',
      validate: '@'
    },
    template: require('access_control/templates/UserRoleSelector').default(),
    controller: ['$scope', function ($scope) {
      var UserListHandler = require('UserListHandler');

      $scope.userListHandler = UserListHandler.create();
      $scope.selectedRoles = $scope.selectedRoles || {};
    }]
  };
}]);
