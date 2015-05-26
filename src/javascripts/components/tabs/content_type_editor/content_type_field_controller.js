'use strict';
angular.module('contentful')
.controller('ContentTypeFieldController', ['$scope', '$injector',
function ($scope, $injector) {
  var modalDialog  = $injector.get('modalDialog');
  var fieldFactory = $injector.get('fieldFactory');
  var trackField    = $injector.get('analyticsEvents').trackField;

  $scope.openSettingsDialog = function openSettingsDialog() {
    trackOpenSettingsDialog($scope.field);
    modalDialog.open({
      scope: $scope,
      title: 'Field Settings',
      template: 'field_dialog',
      ignoreEnter: true
    }).promise.then(function () {
      $scope.contentTypeForm.$setDirty();
    });
  };

  $scope.toggleDisableField = function () {
    this.field.disabled = !this.field.disabled;

    var actionName = this.field.disabled ? 'disable' : 'enable';
    trackFieldAction(actionName, this.field);
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

  /**
   * @ngdoc analytics-event
   * @name Clicked Field Settings Button
   * @param fieldId
   * @param originatingFieldType
   */
  function trackOpenSettingsDialog (field) {
    trackField('Clicked Field Settings Button', field);
  }

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
