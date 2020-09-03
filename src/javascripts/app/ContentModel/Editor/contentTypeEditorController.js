import React from 'react';
import { registerController, registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import validation from '@contentful/validation';
import * as Analytics from 'analytics/Analytics';
import { openFieldDialog } from 'components/field_dialog/openFieldDialog';
import { syncControls } from 'widgets/EditorInterfaceTransformer';
import { openDisallowDialog, openOmitDialog, openSaveDialog } from './FieldsTab/FieldTabDialogs';
import { openCreateContentTypeDialog, openEditContentTypeDialog } from './Dialogs';
import getContentTypePreview from './PreviewTab/getContentTypePreview';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { createCommand } from 'utils/command/command';

import createActions from 'app/ContentModel/Editor/Actions';
import * as accessChecker from 'access_control/AccessChecker';
import ContentTypesPage from 'app/ContentModel/Editor/ContentTypesPage';

import { AddFieldDialogModal } from './Dialogs/AddField';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

export default function register() {
  registerDirective('cfContentTypeEditor', [
    () => ({
      template: '<react-component component="component" props="componentProps"></react-component>',
      restrict: 'A',
      controller: 'ContentTypeEditorController',
      controllerAs: 'ctEditorController',
    }),
  ]);

  /**
   * @scope.requires  context
   * @scope.provides  contentType
   */
  // todo: need to write tests for this view once is fully migrated to React
  registerController('ContentTypeEditorController', [
    '$scope',
    '$state',
    function ContentTypeEditorController($scope, $state) {
      const controller = this;

      $scope.context.dirty = false;

      $scope.actions = createActions($scope, $scope.contentTypeIds);
      $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(
        $scope.actions.saveAndClose
      );

      // We want to track if the user is creating a new CT, but the save
      // action is enforced. Somehow they got to this page, but weren't
      // able to save the CT.

      $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

      if ($scope.context.isNew) {
        const openCreateDialog = async () => {
          openCreateContentTypeDialog($scope.contentTypeIds).then(
            (result) => {
              if (result) {
                $scope.contentType.data.name = result.name;
                $scope.contentType.data.description = result.description;
                $scope.contentType.data.sys.id = result.contentTypeId;
              } else {
                // X.detail.fields -> X.list
                $state.go('^.^.list');
              }
            },
            () => {}
          );
        };
        openCreateDialog();
      }

      /**
       * @ngdoc method
       * @name ContentTypeEditorController#getPublishedField
       * @description
       * Get the field data for the given ID from the content type data
       * published on the server.
       *
       * @param {string} id
       * @returns {API.ContentType.Field}
       */
      controller.getPublishedField = (id) => {
        const publishedFields = _.get($scope.publishedContentType, 'data.fields', []);
        return _.cloneDeep(_.find(publishedFields, { id: id }));
      };

      /**
       * @ngdoc method
       * @name ContentTypeEditorController#removeField
       * @param {string} id
       */
      controller.removeField = (id) => {
        const fields = $scope.contentType.data.fields;
        _.remove(fields, { id: id });
        syncEditorInterface();
      };

      controller.updateField = (id, update) => {
        const fields = $scope.contentType.data.fields;
        const updatedFields = fields.map((field) => {
          if (field.id === id) {
            return {
              ...field,
              ...update,
            };
          }
          return field;
        });
        $scope.contentType.data.fields = updatedFields;
      };

      controller.openFieldDialog = (field) => {
        const fieldId = field.apiName || field.id;
        const control = ($scope.editorInterface.controls || []).find((control) => {
          return control.fieldId === fieldId;
        });

        return openFieldDialog($scope, field, control);
      };

      const setFieldAsTitle = (field) => {
        $scope.contentType.data.displayField = field.id;
        setDirty();
      };

      const updateOrder = (fields) => {
        $scope.contentType.data.fields = fields;
        setDirty();
      };

      const toggleFieldProperty = (field, property, isTitle) => {
        const toggled = !field[property];

        if (isTitle && toggled) {
          openDisallowDialog({ field, action: 'disable' });
        } else {
          controller.updateField(field.id, {
            [property]: toggled,
          });
          setDirty();
        }
      };

      const deleteField = (field, isTitle) => {
        const publishedField = controller.getPublishedField(field.id);
        const publishedOmitted = publishedField && publishedField.omitted;

        const isOmittedInApiAndUi = publishedOmitted && field.omitted;
        const isOmittedInUiOnly = !publishedOmitted && field.omitted;

        if (isTitle) {
          openDisallowDialog({ field, action: 'delete' });
        } else if (!publishedField) {
          controller.removeField(field.id);
        } else if (isOmittedInApiAndUi) {
          controller.updateField(field.id, {
            deleted: true,
          });
          setDirty();
        } else if (isOmittedInUiOnly) {
          openSaveDialog().then(() => {
            $scope.actions.save.execute();
          });
        } else {
          openOmitDialog().then(() => {
            toggleFieldProperty(field, 'omitted', isTitle);
          });
        }
      };

      const undeleteField = (field) => {
        controller.updateField(field.id, {
          deleted: false,
        });
        setDirty();
      };

      function setDirty() {
        $scope.context.dirty = true;
        $scope.$applyAsync();
      }

      const showMetadataDialog = createCommand(
        () => {
          openEditContentTypeDialog($scope.contentType).then((result) => {
            if (result) {
              const { name, description } = result;
              $scope.contentType.data.name = name;
              $scope.contentType.data.description = description;
              setDirty();
            }
          });
        },
        {
          disabled: function () {
            return (
              accessChecker.shouldDisable('update', 'contentType') ||
              accessChecker.shouldDisable('publish', 'contentType')
            );
          },
        }
      );

      const showNewFieldDialog = createCommand(
        () => {
          const existingApiNames = $scope.contentType.data.fields.map(({ apiName }) => apiName);
          ModalLauncher.open(({ isShown, onClose }) => (
            <AddFieldDialogModal
              isShown={isShown}
              onClose={onClose}
              onConfirm={addField}
              onConfirmAndConfigure={(field) => {
                addField(field);
                $scope.ctEditorController.openFieldDialog(field);
              }}
              existingApiNames={existingApiNames}
            />
          ));
        },
        {
          disabled: function () {
            return (
              accessChecker.shouldDisable('update', 'contentType') ||
              accessChecker.shouldDisable('publish', 'contentType')
            );
          },
        }
      );

      const updateSidebarConfiguration = (updatedSidebar) => {
        if (!_.isEqual($scope.editorInterface.sidebar, updatedSidebar)) {
          $scope.editorInterface.sidebar = updatedSidebar;
          $scope.$applyAsync();
          setDirty();
        }
      };

      const updateEditorConfiguration = (updatedEditors) => {
        $scope.editorInterface.editors = updatedEditors;
        $scope.$applyAsync();
        setDirty();
      };

      function addField(newField) {
        const data = $scope.contentType.data;
        data.fields = data.fields || [];
        data.fields.push(newField);
        $scope.$broadcast('fieldAdded');
        setDirty();
        syncEditorInterface();
        trackAddedField($scope.contentType, newField);
      }

      function trackAddedField(contentType, field) {
        Analytics.track('content_modelling:field_added', {
          contentTypeId: contentType.getId(),
          contentTypeName: contentType.getName(),
          fieldId: field.id,
          fieldName: field.name,
          fieldType: field.type,
          fieldItemType: _.get(field, 'items.type') || null,
          fieldLocalized: field.localized,
          fieldRequired: field.required,
        });
      }

      /**
       * Make sure that each field has a widget and vice versa.
       */
      function syncEditorInterface() {
        $scope.editorInterface.controls = syncControls(
          $scope.contentType.data,
          $scope.editorInterface.controls
        );
      }

      const loadPreview = (isNew) => {
        if (isNew) {
          return getContentTypePreview.fromData($scope.contentType.data);
        } else {
          return getContentTypePreview($scope.contentType);
        }
      };

      function getCurrentTab($state) {
        if ($state.is('^.preview')) {
          return 'preview';
        } else if ($state.is('^.sidebar_configuration')) {
          return 'sidebar_configuration';
        } else if ($state.is('^.entry_editor_configuration')) {
          return 'entry_editor_configuration';
        }
        return 'fields';
      }

      $scope.$watch('contentType.data', (data) => {
        $scope.componentProps = {
          ...$scope.componentProps,
          contentTypeData: data,
        };
        $scope.$applyAsync();
      });

      $scope.$watch(
        () => $scope.context.dirty,
        (isDirty) => {
          $scope.componentProps = {
            ...$scope.componentProps,
            isDirty,
          };
          $scope.$applyAsync();
        }
      );

      $scope.$watch(
        () => $state.current.name,
        () => {
          $scope.componentProps = {
            ...$scope.componentProps,
            currentTab: getCurrentTab($state),
          };
          $scope.$applyAsync();
        }
      );

      $scope.$watch(
        () => $scope.contentType.getName(),
        (name) => {
          $scope.componentProps = {
            ...$scope.componentProps,
            contentTypeName: name,
          };
          $scope.$applyAsync();
        }
      );

      $scope.component = ContentTypesPage;
      $scope.componentProps = {
        isDirty: false,
        isNew: $scope.context.isNew,
        currentTab: getCurrentTab($state),
        canEdit: accessChecker.can('update', 'ContentType'),
        sidebarConfiguration: $scope.editorInterface.sidebar,
        editorConfiguration: $scope.editorInterface.editors,
        extensions: $scope.customWidgets,
        actions: {
          showMetadataDialog,
          showNewFieldDialog,
          save: $scope.actions.save,
          delete: $scope.actions.delete,
          duplicate: $scope.actions.duplicate,
          cancel: $scope.actions.cancel,
          undeleteField,
          updateOrder,
          setFieldAsTitle,
          openFieldDialog: controller.openFieldDialog,
          deleteField,
          toggleFieldProperty,
          updateSidebarConfiguration,
          updateEditorConfiguration,
          loadPreview,
        },
        contentTypeName: $scope.contentType.getName(),
        contentTypeData: $scope.contentType.data,
        hasAdvancedExtensibility: $scope.hasAdvancedExtensibility,
      };
    },
  ]);
}
