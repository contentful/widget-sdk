'use strict';
angular.module('contentful').controller('FieldSettingsEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var modalDialog      = $injector.get('modalDialog');

  $scope.openSettingsDialog = function openSettingsDialog() {
    modalDialog.open({
      scope: $scope,
      title: 'Field Settings',
      message: 'Not implemented yet',
      ignoreEnter: true,
    });
  };
}]);
