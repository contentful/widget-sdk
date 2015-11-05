'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var Command       = $injector.get('command');
  var space         = $injector.get('spaceContext').space;
  var roleRepo      = $injector.get('RoleRepository').getInstance(space);
  var PolicyBuilder = $injector.get('PolicyBuilder');

  $scope.internal = {
    entries: { allowed: [], denied: [] },
    assets: { allowed: [], denied: [] },
    contentTypes: {},
    apiKeys: {},
    spaceSettings: {}
  };

  $scope.$watch('internal', function (internal) {
    $scope.external = PolicyBuilder.external.from(internal);
  }, true);

  $scope.$watch('role.name', function (name) {
    $scope.context.title = name || 'Untitled';
  });

  $scope.save = Command.create(function () {
    var method = $scope.context.isNew ? 'create' : 'save';
    return roleRepo[method]($scope.role).then(handleRole);
  });

  function handleRole(role) {
    $scope.role = role;
    $scope.context.dirty = false;
    $scope.context.isNew = false;
  }
}]);
