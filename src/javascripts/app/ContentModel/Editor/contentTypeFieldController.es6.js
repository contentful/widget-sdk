import { registerController, registerFactory } from 'NgRegistry.es6';
import * as fieldFactory from 'services/fieldFactory.es6';

/**
 * @ngdoc type
 * @name ContentTypeFieldController
 */
registerController('ContentTypeFieldController', [
  '$scope',
  'ContentTypeFieldController/dialogs',
  'fieldDecorator',
  function($scope, dialogs, { isTitleType }) {
    const controller = this;

    $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
    $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

    /**
     * @ngdoc method
     * @name ContentTypeFieldController#openSettingsDialog
     */
    controller.openSettingsDialog = function openSettingsDialog() {
      return $scope.ctEditorController.openFieldDialog($scope.field);
    };

    /**
     * @ngdoc method
     * @name ContentTypeFieldController#toggle
     */
    controller.toggle = function toggle(property) {
      const field = $scope.field;
      const toggled = !field[property];

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
      const publishedField = $scope.ctEditorController.getPublishedField($scope.field.id);
      const publishedOmitted = publishedField && publishedField.omitted;

      const isOmittedInApiAndUi = publishedOmitted && $scope.field.omitted;
      const isOmittedInUiOnly = !publishedOmitted && $scope.field.omitted;

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

    $scope.$watch(
      scope => scope.contentType.data.displayField === scope.field.id,
      isTitle => {
        $scope.fieldIsTitle = isTitle;
      }
    );

    $scope.$watchGroup(['fieldIsTitle', 'field.disabled', 'field.omitted'], () => {
      const isTitle = $scope.fieldIsTitle;
      const disabled = $scope.field.disabled;
      const omitted = $scope.field.omitted;
      $scope.fieldCanBeTitle = isTitleType($scope.field.type) && !isTitle && !disabled && !omitted;
    });
  }
]);

registerFactory('ContentTypeFieldController/dialogs', [
  'modalDialog',
  'encoder',
  (modalDialog, { htmlEncode }) => {
    return {
      openDisallowDialog: openDisallowDialog,
      openOmitDialog: openOmitDialog,
      openSaveDialog: openSaveDialog
    };

    function openDisallowDialog(field, action) {
      action = action === 'disable' ? ['disabled', 'disabling'] : ['deleted', 'deleting'];

      return modalDialog.open({
        title: 'This field can’t be ' + action[0] + ' right now',
        message: [
          'The field <span class="modal-dialog__highlight">',
          htmlEncode(field.name),
          '</span> acts as a title for this content type. Before ',
          action[1],
          ' it you need to choose another field as title.'
        ].join(''),
        confirmLabel: 'Okay, got it',
        cancelLabel: null
      }).promise;
    }

    function openOmitDialog() {
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

    function openSaveDialog() {
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
  }
]);
