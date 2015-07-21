'use strict';
angular.module('contentful')

/**
 * @ngdoc type
 * @name ContentTypeFieldController
 */
.controller('ContentTypeFieldController', ['$scope', '$injector',
function ($scope, $injector) {
  var controller = this;

  var fieldFactory = $injector.get('fieldFactory');
  var trackField   = $injector.get('analyticsEvents').trackField;
  var modalDialog  = $injector.get('modalDialog');
  var Field        = $injector.get('fieldDecorator');

  var disableTitleFieldNotification =
    'This field is a title. Before disabling it you need '+
    'to choose another title field';

  var isTitleType = Field.isTitleType($scope.field.type);

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#openSettingsDialog
   */
  controller.openSettingsDialog = function openSettingsDialog() {
    return $scope.ctEditorController.openFieldDialog($scope.field);
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#toggleDisable
   */
  controller.toggleDisable = function () {
    var isDisabled = !$scope.field.disabled;
    if ($scope.fieldIsTitle && isDisabled) {
      modalDialog.notify(disableTitleFieldNotification);
      return;
    }
    $scope.field.disabled = isDisabled;

    var actionName = isDisabled ? 'disable' : 'enable';
    trackFieldAction(actionName, $scope.field);
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#setAsTitle
   */
  controller.setAsTitle = function () {
    $scope.contentType.data.displayField = $scope.field.id;
  };


  controller.deleteField = function () {
    $scope.ctEditorController.deleteField($scope.field.id);
  };

  // TODO Does not need to be a watcher
  $scope.$watchGroup(['field.type', 'field.linkType', 'field.items.type', 'field.items.linkType'], function () {
    $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
    $scope.iconId = fieldFactory.getIconId($scope.field)+'-small';
  });


  $scope.$watch(function (scope) {
    return scope.contentType.data.displayField === scope.field.id;
  }, function (isTitle) {
    $scope.fieldIsTitle = isTitle;
  });

  $scope.$watchGroup(['fieldIsTitle', 'field.disabled'], function () {
    var isTitle = $scope.fieldIsTitle;
    var disabled = $scope.field.disabled;
    $scope.fieldCanBeTitle = isTitleType && !isTitle && !disabled;
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
