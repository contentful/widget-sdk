'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfUserRoleSelector
 * @description
 * A list of users, each having a dropdown with list of roles to select from.
 */
.directive('cfUserRoleSelector', ['require', function (require) {
  return {
    restrict: 'E',
    bindings: {
      // Array of users
      users: '=',
      // Array of available role options in the format of { id, name }
      roleOptions: '=',
      // Hash with user ids as keys, and role ids as values
      selectedRoles: '=',
      // Flag to enable or disable validation for required role selection
      validate: '@'
    },
    template: require('access_control/templates/UserRoleSelector').default()
  };
}]);
