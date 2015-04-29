'use strict';
angular.module('contentful').controller('FieldSettingsEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var $controller      = $injector.get('$controller');
  var modalDialog      = $injector.get('modalDialog');

  $scope.apiNameController = $controller('ApiNameController', {$scope: $scope});

  $scope.openSettingsDialog = function openSettingsDialog() {
    modalDialog.open({
      scope: $scope,
      title: 'Field Settings',
      message: 'Not implemented yet',
      ignoreEnter: true,
    });
  };
}]);
