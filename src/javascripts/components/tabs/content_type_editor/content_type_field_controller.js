'use strict';
angular.module('contentful')
.controller('ContentTypeFieldController', ['$scope', '$injector',
function ($scope, $injector) {
  var fieldFactory    = $injector.get('fieldFactory');
  var trackField      = $injector.get('analyticsEvents').trackField;

  $scope.openSettingsDialog = function openSettingsDialog() {
    return $scope.ctEditorController.openFieldDialog($scope.field);
  };

  $scope.toggleDisableField = function () {
    this.field.disabled = !this.field.disabled;

    var actionName = this.field.disabled ? 'disable' : 'enable';
    trackFieldAction(actionName, this.field);
  };

  $scope.deleteField = function () {
    $scope.ctEditorController.deleteField($scope.field.id);
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

  $scope.$watchCollection('publishedContentType.data.fields', function (fields) {
    $scope.isPublished = !!_.find(fields, {id: $scope.field.id});
  });

  /**
   * @ngdoc analytics-event
   * @name Clicked Field Actions Button
   * @param action
   * @param fieldId
   * @param originatingFieldType
   */
  function trackFieldAction (actionName, field) {
    trackField('Clicked Field Actions Button', field, {
      action: actionName,
    });
  }

}]);
