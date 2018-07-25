'use strict';

/**
 * @ngdoc type
 * @name ContentTypeEditorController
 *
 * @scope.requires  context
 * @scope.requires  contentTypeForm
 *
 * @scope.provides  contentType
 * @scope.provides  hasFields
 */
angular.module('contentful')
.controller('ContentTypeEditorController', ['$scope', 'require', function ContentTypeEditorController ($scope, require) {
  const controller = this;
  const $state = require('$state');
  const validation = require('validation');
  const modalDialog = require('modalDialog');
  const openFieldDialog = require('openFieldDialog');
  const leaveConfirmator = require('navigation/confirmLeaveEditor');
  const metadataDialog = require('contentTypeEditor/metadataDialog');
  const Command = require('command');
  const accessChecker = require('access_control/AccessChecker');
  const ctHelpers = require('data/ContentTypes');
  const eiHelpers = require('editingInterfaces/helpers');
  const spaceContext = require('spaceContext');
  const editingInterfaces = spaceContext.editingInterfaces;
  const Analytics = require('analytics/Analytics');
  const createActions = require('app/ContentModel/Editor/Actions').default;

  const contentTypeIds = spaceContext.cma.getContentTypes().then(response => response.items.map(ct => ct.sys.id));

  const canEdit = accessChecker.can('update', 'ContentType');
  // Read-only data for template
  $scope.data = {
    canEdit: canEdit
  };

  // TODO This does not belong here. Instead it should be set in the template.
  // Unfortunately the cfUiSortable directive does not support this.
  $scope.uiSortable = {
    disabled: !canEdit,
    placeholder: 'ct-field--placeholder'
  };

  $scope.actions = createActions($scope, contentTypeIds);

  $scope.stateIs = $state.is;

  $scope.goTo = stateName => {
    $state.go('^.' + stateName);
  };

  $scope.context.requestLeaveConfirmation = leaveConfirmator($scope.actions.saveAndClose);
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty', setDirtyState);
  $scope.$watch('context.isNew', setDirtyState);

  $scope.$watch(() => $scope.contentType.getName(), title => {
    $scope.context.title = title;
  });

  $scope.$watch('contentType.data.fields', (newVal, oldVal) => {
    checkForDirtyForm(newVal, oldVal);
  }, true);

  $scope.$watch('contentType.data.fields.length', length => {
    $scope.hasFields = length > 0;
    ctHelpers.assureDisplayField($scope.contentType.data);
    setDirtyState();
    $scope.data.fieldsUsed = length;
  });

  if ($scope.context.isNew) {
    metadataDialog.openCreateDialog(contentTypeIds)
    .then(applyContentTypeMetadata(true), () => {
      // X.detail.fields -> X.list
      $state.go('^.^.list');
    });
  }

  function applyContentTypeMetadata (withId) {
    return metadata => {
      const data = $scope.contentType.data;
      data.name = metadata.name;
      data.description = metadata.description;
      if (withId) {
        data.sys.id = metadata.id;
      }
      $scope.contentTypeForm.$setDirty();
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
    return _.cloneDeep(_.find(publishedFields, {id: id}));
  };

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#removeField
   * @param {string} id
   */
  controller.removeField = id => {
    const fields = $scope.contentType.data.fields;
    _.remove(fields, {id: id});
    syncEditingInterface();
  };

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#openFieldDialog
   * @param {Client.ContentType.Field} field
   */
  controller.openFieldDialog = field => {
    const control = eiHelpers.findWidget($scope.editingInterface.controls, field);
    return openFieldDialog($scope, field, control)
    .then(() => {
      $scope.contentTypeForm.$setDirty();
    });
  };

  function checkForDirtyForm (newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.contentTypeForm.$setDirty();
    }
  }

  function setDirtyState () {
    let modified = $scope.contentTypeForm.$dirty;
    if (modified === true && $scope.context.isNew && $scope.contentType.data.fields.length < 1) {
      modified = false;
    }
    $scope.context.dirty = !!modified;
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#$scope.showMetadataDialog
  */
  $scope.showMetadataDialog = Command.create(() => {
    metadataDialog.openEditDialog($scope.contentType)
    .then(applyContentTypeMetadata());
  }, {
    disabled: function () {
      return accessChecker.shouldDisable('updateContentType') ||
             accessChecker.shouldDisable('publishContentType');
    }
  });

  /**
   * @ngdoc property
   * @name ContentTypeEditorController#$scope.showNewFieldDialog
   */
  $scope.showNewFieldDialog = Command.create(() => {
    modalDialog.open({
      template: 'add_field_dialog',
      scope: $scope
    }).promise
    .then(addField);
  }, {
    disabled: function () {
      return accessChecker.shouldDisable('updateContentType') ||
             accessChecker.shouldDisable('publishContentType');
    }
  });

  function addField (newField) {
    const data = $scope.contentType.data;
    data.fields = data.fields || [];
    data.fields.push(newField);
    $scope.$broadcast('fieldAdded');
    syncEditingInterface();
    trackAddedField($scope.contentType, newField);
  }

  function trackAddedField (contentType, field) {
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
  function syncEditingInterface () {
    editingInterfaces.syncControls($scope.contentType.data, $scope.editingInterface);
  }
}]);
