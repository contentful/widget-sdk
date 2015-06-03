'use strict';
angular.module('contentful')
.controller('ContentTypeFieldController', ['$scope', '$injector',
function ($scope, $injector) {
  var modalDialog  = $injector.get('modalDialog');
  var fieldFactory = $injector.get('fieldFactory');

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

  $scope.toggleDisableField = function () {
    this.field.disabled = !this.field.disabled;
  };

  $scope.$watchGroup(['field.type', 'field.linkType', 'field.items.type', 'field.items.linkType'], function () {
    $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
    $scope.iconId = fieldFactory.getIconId($scope.field)+'-small';
  });

  $scope.$watch(function (scope) {
    return scope.contentType.data.displayField === scope.field.id;
  }, function (isTitle) {
    $scope.fieldIsTitle = isTitle;
  });

}]);
