'use strict';

angular.module('contentful').directive('cfRoleEditor', function () {
  return {
    restrict: 'E',
    template: JST['role_editor'](),
    controller: 'RoleEditorController'
  };
});

angular.module('contentful').controller('RoleEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var Command        = $injector.get('command');
  var RoleRepository = $injector.get('RoleRepository');
  var $state         = $injector.get('$state');
  var spaceContext   = $injector.get('spaceContext');

  $scope.$watch('role.name', function (name) {
    $scope.context.title = getId() ? name : 'New role';
  });

  $scope.$watch('roleForm.$dirty', function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  $scope.save = Command.create(function () {
    var roleRepository = RoleRepository.getInstance(spaceContext.space);
    return roleRepository.save($scope.role).then(function (role) {
      $scope.role = role;
      $scope.roleForm.$setPristine();
      $scope.context.dirty = false;
    });
  });

  $scope.delete = Command.create(function () {
    // @todo DELETE
  }, {
    available: function () {
      return !$scope.context.isNew && getId();
    }
  });

  $scope.cancel = Command.create(function () {
    // @todo confirmation dialog
    return $state.go('^.list');
  }, {
    available: function () {
      return $scope.context.isNew;
    }
  });

  function getId() {
    return dotty.get($scope, 'role.sys.id');
  }
}]);
