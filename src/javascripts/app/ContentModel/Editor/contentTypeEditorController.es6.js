import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import validation from '@contentful/validation';
import assureDisplayField from 'data/ContentTypeRepo/assureDisplayField.es6';
import { syncControls } from 'widgets/EditorInterfaceTransformer.es6';
import {
  openDisallowDialog,
  openOmitDialog,
  openSaveDialog
} from './FieldsTab/FieldTabDialogs.es6';
import getContentTypePreview from './PreviewTab/getContentTypePreview.es6';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

export default function register() {
  /**
   * @ngdoc type
   * @name ContentTypeEditorController
   *
   * @scope.requires  context
   *
   * @scope.provides  contentType
   * @scope.provides  hasFields
   */
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
    'navigation/confirmLeaveEditor',
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
      { default: createActions },
      leaveConfirmator
    ) {
      const controller = this;
      const contentTypeIds = spaceContext.cma
        .getContentTypes()
        .then(response => response.items.map(ct => ct.sys.id));

      $scope.context.dirty = false;

      const canEdit = accessChecker.can('update', 'ContentType');
      // Read-only data for template
      $scope.data = { canEdit: canEdit };

      $scope.actions = createActions($scope, contentTypeIds);
      $scope.context.requestLeaveConfirmation = leaveConfirmator($scope.actions.saveAndClose);

      // We want to track if the user is creating a new CT, but the save
      // action is enforced. Somehow they got to this page, but weren't
      // able to save the CT.

      $scope.stateIs = $state.is;

      $scope.goTo = stateName => {
        $state.go('^.' + stateName);
      };

      $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

      $scope.$watch(
        () => $scope.contentType.getName(),
        title => {
          $scope.context.title = title;
        }
      );

      $scope.$watch('contentType.data.fields.length', length => {
        $scope.hasFields = length > 0;
        assureDisplayField($scope.contentType.data);
        $scope.data.fieldsUsed = length;
      });

      if ($scope.context.isNew) {
        metadataDialog.openCreateDialog(contentTypeIds).then(applyContentTypeMetadata(true), () => {
          // X.detail.fields -> X.list
          $state.go('^.^.list');
        });
      }

      function applyContentTypeMetadata(withId) {
        return metadata => {
          const data = $scope.contentType.data;
          data.name = metadata.name;
          data.description = metadata.description;
          if (withId) {
            data.sys.id = metadata.id;
          }
          setDirty();
        };
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

      /**
       * @ngdoc method
       * @name ContentTypeEditorController#openFieldDialog
       * @param {Client.ContentType.Field} field
       */
      controller.openFieldDialog = field => {
        const fieldId = field.apiName || field.id;
        const control = ($scope.editorInterface.controls || []).find(control => {
          return control.fieldId === fieldId;
        });

        return openFieldDialog($scope, field, control).then(setDirty);
      };

      controller.setFieldAsTitle = field => {
        $scope.contentType.data.displayField = field.id;
        setDirty();
      };

      controller.updateOrder = fields => {
        $scope.contentType.data.fields = fields;
        setDirty();
      };

      controller.toggleFieldProperty = (field, property, isTitle) => {
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

      controller.deleteField = (field, isTitle) => {
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
            controller.toggleFieldProperty(field, 'omitted', isTitle);
          });
        }
      };

      controller.undeleteField = field => {
        controller.updateField(field.id, {
          deleted: false
        });
        setDirty();
      };

      function setDirty() {
        $scope.context.dirty = true;
        $scope.$applyAsync();
      }

      /**
       * @ngdoc method
       * @name ContentTypeEditorController#$scope.showMetadataDialog
       */
      $scope.showMetadataDialog = Command.create(
        () => {
          metadataDialog.openEditDialog($scope.contentType).then(applyContentTypeMetadata());
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

      /**
       * @ngdoc property
       * @name ContentTypeEditorController#$scope.showNewFieldDialog
       */
      $scope.showNewFieldDialog = Command.create(
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

      $scope.initialSidebarConfiguration = $scope.editorInterface.sidebar;
      $scope.sidebarExtensions = $scope.widgets[NAMESPACE_EXTENSION] || [];

      $scope.updateSidebarConfiguration = updatedSidebar => {
        if (!_.isEqual($scope.editorInterface.sidebar, updatedSidebar)) {
          $scope.editorInterface.sidebar = updatedSidebar;
          $scope.$applyAsync();
          setDirty();
        }
      };

      $scope.buildContentTypeIdInputProps = () => ({
        value: $scope.contentType.data.sys.id,
        name: 'contentTypeIdInput',
        id: 'contentTypeIdInput',
        testId: 'contentTypeIdInput',
        withCopyButton: true,
        disabled: true
      });

      function addField(newField) {
        const data = $scope.contentType.data;
        data.fields = data.fields || [];
        data.fields.push(newField);
        $scope.$broadcast('fieldAdded');
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

      /**
       * ContentType Preview
       */

      $scope.contentPreviewProps = {
        isLoading: false,
        isNew: false,
        isDirty: $scope.context.dirty,
        preview: null
      };

      function updateContentPreviewProps(update) {
        $scope.contentPreviewProps = {
          ...$scope.contentPreviewProps,
          ...update
        };
        $scope.$applyAsync();
      }

      $scope.$watch('context.dirty', isDirty => {
        updateContentPreviewProps({
          isDirty
        });
      });

      $scope.$watch(
        'contentType.data',
        data => {
          const publishedVersion = _.get(data, 'sys.publishedVersion');

          const isNew = !publishedVersion;

          updateContentPreviewProps({
            isNew
          });

          loadPreview(isNew).then(preview => {
            updateContentPreviewProps({
              preview
            });
          });
        },
        true
      );

      function loadPreview(isNew) {
        if (isNew) {
          return loadLocalPreview();
        } else {
          return loadServerPreview();
        }
      }

      function loadServerPreview() {
        updateContentPreviewProps({
          isLoading: true
        });

        return getContentTypePreview($scope.contentType).then(preview => {
          updateContentPreviewProps({
            isLoading: false
          });
          return preview;
        });
      }

      function loadLocalPreview() {
        return getContentTypePreview.fromData($scope.contentType);
      }
    }
  ]);
}
