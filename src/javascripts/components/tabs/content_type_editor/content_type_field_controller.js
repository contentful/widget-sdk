'use strict';
angular.module('contentful')

/**
 * @ngdoc type
 * @name ContentTypeFieldController
 */
.controller('ContentTypeFieldController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var fieldFactory = require('fieldFactory');
  var trackField = require('analyticsEvents').trackField;
  var Field = require('fieldDecorator');
  var dialogs = require('ContentTypeFieldController/dialogs');

  var isTitleType = Field.isTitleType($scope.field.type);

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
    var toggled = !$scope.field[property];

    if ($scope.fieldIsTitle && toggled) {
      dialogs.openDisallowDialog($scope.field, 'disable');
    } else {
      $scope.field[property] = toggled;
      trackFieldAction(property, $scope.field);
    }
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#setAsTitle
   */
  controller.setAsTitle = function () {
    $scope.contentType.data.displayField = $scope.field.id;
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#delete
   */
  controller.delete = function () {
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
      dialogs.openSaveDialog().then(function () {
        return $scope.actions.save.execute();
      });
    } else {
      dialogs.openOmitDialog().then(function () {
        controller.toggle('omitted');
      });
    }
  };

  /**
   * @ngdoc method
   * @name ContentTypeFieldController#undelete
   */
  controller.undelete = function () {
    delete $scope.field.deleted;
  };

  $scope.$watch(function (scope) {
    return scope.contentType.data.displayField === scope.field.id;
  }, function (isTitle) {
    $scope.fieldIsTitle = isTitle;
  });

  $scope.$watchGroup(['fieldIsTitle', 'field.disabled', 'field.omitted'], function () {
    var isTitle = $scope.fieldIsTitle;
    var disabled = $scope.field.disabled;
    var omitted = $scope.field.omitted;
    $scope.fieldCanBeTitle = isTitleType && !isTitle && !disabled && !omitted;
  });

  /**
   * @ngdoc analytics-event
   * @name Clicked Field Actions Button
   * @param property
   * @param field
   */
  function trackFieldAction (property, field) {
    trackField('Clicked Field Actions Button', field, {
      action: [field[property] ? 'on' : 'off', property].join('-')
    });
  }
}])

.factory('ContentTypeFieldController/dialogs', ['require', function (require) {

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
        ' it you need too choose another field as title.'
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
        'look like after deletion. We prevent deleting active fields for security ',
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
