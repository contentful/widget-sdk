'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var Command  = $injector.get('command');
  var space    = $injector.get('spaceContext').space;
  var roleRepo = $injector.get('RoleRepository').getInstance(space);

  $scope.$watch('role.name', function (name) {
    $scope.context.title = name ? name : 'Untitled';
  });

  $scope.$watch('roleForm.$dirty', function (isDirty) {
    $scope.context.dirty = isDirty || $scope.context.isNew;
  });

  $scope.save = Command.create(function () {
    var method = $scope.context.isNew ? 'create' : 'save';
    return roleRepo[method]($scope.role).then(handleRole);
  });

  function handleRole(role) {
    $scope.role = role;
    $scope.roleForm.$setPristine();
    $scope.context.dirty = false;
    $scope.context.isNew = false;
  }
}]);
