'use strict';
angular.module('contentful').controller('FieldSettingsEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var modalDialog      = $injector.get('modalDialog');

  $scope.openSettingsDialog = function openSettingsDialog() {
    var dialog = modalDialog.open({
      scope: $scope,
      title: 'Field Settings',
      template: 'field_dialog',
      ignoreEnter: true
    });
    dialog.promise.then(function () {
      $scope.contentTypeForm.$setDirty();
    });
  };
}]);
