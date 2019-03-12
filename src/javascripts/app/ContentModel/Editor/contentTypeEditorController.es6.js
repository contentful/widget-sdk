import { registerController, registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import validation from '@contentful/validation';

import { syncControls } from 'widgets/EditorInterfaceTransformer.es6';
import {
  openDisallowDialog,
  openOmitDialog,
  openSaveDialog
} from './FieldsTab/FieldTabDialogs.es6';
import getContentTypePreview from './PreviewTab/getContentTypePreview.es6';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

export default function register() {
  registerDirective('cfContentTypeEditor', [
    () => ({
      template:
        '<react-component name="app/ContentModel/Editor/ContentTypesPage.es6" props="componentProps" />',
      restrict: 'A',
      controller: 'ContentTypeEditorController',
      controllerAs: 'ctEditorController'
    })
  ]);

  /**
   * @scope.requires  context
   * @scope.provides  contentType
   */
  // todo: need to write tests for this view once is fully migrated to React
  registerController('ContentTypeEditorController', [
    '$scope',
    '$state',
    'modalDialog',
    'command',
    'spaceContext',
    'openFieldDialog',
    'contentTypeEditor/metadataDialog',
    'access_control/AccessChecker',
    'analytics/Analytics.es6',
    'app/ContentModel/Editor/Actions.es6',
    function ContentTypeEditorController(
      $scope,
      $state,
      modalDialog,
      Command,
      spaceContext,
      openFieldDialog,
      metadataDialog,
      accessChecker,
      Analytics,
      { default: createActions }
    ) {
      const controller = this;
      const contentTypeIds = spaceContext.cma
        .getContentTypes()
        .then(response => response.items.map(ct => ct.sys.id));

      $scope.context.dirty = false;

      $scope.actions = createActions($scope, contentTypeIds);
      $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(
        $scope.actions.saveAndClose
      );

      // We want to track if the user is creating a new CT, but the save
      // action is enforced. Somehow they got to this page, but weren't
      // able to save the CT.

      $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

      if ($scope.context.isNew) {
        metadataDialog.openCreateDialog(contentTypeIds).then(
          metadata => {
            const data = $scope.contentType.data;
            data.name = metadata.name;
            data.description = metadata.description;
            data.sys.id = metadata.id;
          },
          () => {
            // X.detail.fields -> X.list
            $state.go('^.^.list');
          }
        );
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
      controller.getPublishedField = id => {
        const publishedFields = _.get($scope.publishedContentType, 'data.fields', []);
        return _.cloneDeep(_.find(publishedFields, { id: id }));
      };

      /**
       * @ngdoc method
       * @name ContentTypeEditorController#removeField
       * @param {string} id
       */
      controller.removeField = id => {
        const fields = $scope.contentType.data.fields;
        _.remove(fields, { id: id });
        syncEditorInterface();
      };

      controller.updateField = (id, update) => {
        const fields = $scope.contentType.data.fields;
        const updatedFields = fields.map(field => {
          if (field.id === id) {
            return {
              ...field,
              ...update
            };
          }
          return field;
        });
        $scope.contentType.data.fields = updatedFields;
      };

      controller.openFieldDialog = field => {
        const fieldId = field.apiName || field.id;
        const control = ($scope.editorInterface.controls || []).find(control => {
          return control.fieldId === fieldId;
        });

        return openFieldDialog($scope, field, control).then(setDirty);
      };

      const setFieldAsTitle = field => {
        $scope.contentType.data.displayField = field.id;
        setDirty();
      };

      const updateOrder = fields => {
        $scope.contentType.data.fields = fields;
        setDirty();
      };

      const toggleFieldProperty = (field, property, isTitle) => {
        const toggled = !field[property];

        if (isTitle && toggled) {
          openDisallowDialog({ field, action: 'disable' });
        } else {
          controller.updateField(field.id, {
            [property]: toggled
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
            deleted: true
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

      const undeleteField = field => {
        controller.updateField(field.id, {
          deleted: false
        });
        setDirty();
      };

      function setDirty() {
        $scope.context.dirty = true;
        $scope.$applyAsync();
      }

      const showMetadataDialog = Command.create(
        () => {
          metadataDialog.openEditDialog($scope.contentType).then(metadata => {
            const data = $scope.contentType.data;
            data.name = metadata.name;
            data.description = metadata.description;
            setDirty();
          });
        },
        {
          disabled: function() {
            return (
              accessChecker.shouldDisable('update', 'contentType') ||
              accessChecker.shouldDisable('publish', 'contentType')
            );
          }
        }
      );

      const showNewFieldDialog = Command.create(
        () => {
          modalDialog
            .open({
              template: 'add_field_dialog',
              scope: $scope
            })
            .promise.then(addField);
        },
        {
          disabled: function() {
            return (
              accessChecker.shouldDisable('update', 'contentType') ||
              accessChecker.shouldDisable('publish', 'contentType')
            );
          }
        }
      );

      $scope.sidebarExtensions = ($scope.widgets[NAMESPACE_EXTENSION] || []).filter(
        widget => widget.sidebar === true
      );

      const updateSidebarConfiguration = updatedSidebar => {
        if (!_.isEqual($scope.editorInterface.sidebar, updatedSidebar)) {
          $scope.editorInterface.sidebar = updatedSidebar;
          $scope.$applyAsync();
          setDirty();
        }
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
        Analytics.track('modelling:field_added', {
          contentTypeId: contentType.getId(),
          contentTypeName: contentType.getName(),
          fieldId: field.id,
          fieldName: field.name,
          fieldType: field.type,
          fieldItemType: _.get(field, 'items.type') || null,
          fieldLocalized: field.localized,
          fieldRequired: field.required
        });
      }

      /**
       * Make sure that each field has a widget and vice versa.
       */
      function syncEditorInterface() {
        $scope.editorInterface.controls = syncControls(
          $scope.contentType.data,
          $scope.editorInterface.controls,
          $scope.widgets
        );
      }

      const loadPreview = () => {
        const isNew = !_.get($scope.contentType.data, 'sys.publishedVersion');
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
        }
        return 'fields';
      }

      $scope.$watch('contentType.data', data => {
        $scope.componentProps = {
          ...$scope.componentProps,
          contentTypeData: data
        };
        $scope.$applyAsync();
      });

      $scope.$watch(
        () => $scope.context.dirty,
        isDirty => {
          $scope.componentProps = {
            ...$scope.componentProps,
            isDirty
          };
          $scope.$applyAsync();
        }
      );

      $scope.$watch(
        () => $state.current.name,
        () => {
          $scope.componentProps = {
            ...$scope.componentProps,
            currentTab: getCurrentTab($state)
          };
          $scope.$applyAsync();
        }
      );

      $scope.$watch(
        () => $scope.contentType.getName(),
        name => {
          $scope.componentProps = {
            ...$scope.componentProps,
            contentTypeName: name
          };
          $scope.$applyAsync();
        }
      );

      $scope.componentProps = {
        isDirty: false,
        isNew: $scope.context.isNew,
        currentTab: getCurrentTab($state),
        canEdit: accessChecker.can('update', 'ContentType'),
        configuration: $scope.editorInterface.sidebar,
        extensions: $scope.sidebarExtensions,
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
          loadPreview
        },
        contentTypeName: $scope.contentType.getName(),
        contentTypeData: $scope.contentType.data,
        hasCustomSidebarFeature: $scope.hasCustomSidebarFeature
      };
    }
  ]);
}
