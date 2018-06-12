'use strict';
angular.module('contentful')

/**
 * @ngdoc type
 * @name ContentTypeFieldController
 */
.controller('ContentTypeFieldController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var fieldFactory = require('fieldFactory');
  var isTitleType = require('fieldDecorator').isTitleType;
  var dialogs = require('ContentTypeFieldController/dialogs');

  $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
  $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#openSettingsDialog
   */
  controller.openSettingsDialog = function openSettingsDialog () {
    return $scope.ctEditorController.openFieldDialog($scope.field);
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#toggle
   */
  controller.toggle = function toggle (property) {
    var field = $scope.field;
    var toggled = !field[property];

    if ($scope.fieldIsTitle && toggled) {
      dialogs.openDisallowDialog(field, 'disable');
    } else {
      field[property] = toggled;
    }
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#setAsTitle
   */
  controller.setAsTitle = () => {
    $scope.contentType.data.displayField = $scope.field.id;
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#delete
   */
  controller.delete = () => {
    var publishedField = $scope.ctEditorController.getPublishedField($scope.field.id);
    var publishedOmitted = publishedField && publishedField.omitted;

    var isOmittedInApiAndUi = publishedOmitted && $scope.field.omitted;
    var isOmittedInUiOnly = !publishedOmitted && $scope.field.omitted;

    if ($scope.fieldIsTitle) {
      dialogs.openDisallowDialog($scope.field, 'delete');
    } else if (!publishedField) {
      $scope.ctEditorController.removeField($scope.field.id);
    } else if (isOmittedInApiAndUi) {
      $scope.field.deleted = true;
    } else if (isOmittedInUiOnly) {
      dialogs.openSaveDialog().then(() => $scope.actions.save.execute());
    } else {
      dialogs.openOmitDialog().then(() => {
        controller.toggle('omitted');
      });
    }
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#undelete
   */
  controller.undelete = () => {
    delete $scope.field.deleted;
  };

  $scope.$watch(scope => scope.contentType.data.displayField === scope.field.id, isTitle => {
    $scope.fieldIsTitle = isTitle;
  });

  $scope.$watchGroup(['fieldIsTitle', 'field.disabled', 'field.omitted'], () => {
    var isTitle = $scope.fieldIsTitle;
    var disabled = $scope.field.disabled;
    var omitted = $scope.field.omitted;
    $scope.fieldCanBeTitle = isTitleType($scope.field.type) && !isTitle && !disabled && !omitted;
  });
}])

.factory('ContentTypeFieldController/dialogs', ['require', require => {
  var modalDialog = require('modalDialog');
  var htmlEncode = require('encoder').htmlEncode;

  return {
    openDisallowDialog: openDisallowDialog,
    openOmitDialog: openOmitDialog,
    openSaveDialog: openSaveDialog
  };

  function openDisallowDialog (field, action) {
    action = action === 'disable' ? ['disabled', 'disabling'] : ['deleted', 'deleting'];

    return modalDialog.open({
      title: 'This field can’t be ' + action[0] + ' right now',
      message: [
        'The field <span class="modal-dialog__highlight">', htmlEncode(field.name),
        '</span> acts as a title for this content type. Before ', action[1],
        ' it you need to choose another field as title.'
      ].join(''),
      confirmLabel: 'Okay, got it',
      cancelLabel: null
    }).promise;
  }

  function openOmitDialog () {
    return modalDialog.open({
      title: 'You can’t delete an active field',
      message: [
        'Please <em>disable in response</em> and save your content type before ',
        'deleting a&nbsp;field. This way you can preview how your responses will ',
        'look after deletion. We prevent deleting active fields for security ',
        'reasons &ndash;&nbsp;we don’t want you to lose your precious content or ',
        'break your apps.'
      ].join(''),
      confirmLabel: 'Okay, disable field in response',
      cancelLabel: null
    }).promise;
  }

  function openSaveDialog () {
    return modalDialog.open({
      title: 'You can’t delete the field yet',
      message: [
        'Please save the content type first. You’ve disabled the field, and this ',
        'setting needs to be saved.'
      ].join(''),
      confirmLabel: 'Save content type',
      cancelLabel: null
    }).promise;
  }
}]);
