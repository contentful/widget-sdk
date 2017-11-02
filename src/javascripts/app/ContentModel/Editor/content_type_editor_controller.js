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
  var controller = this;
  var $state = require('$state');
  var validation = require('validation');
  var modalDialog = require('modalDialog');
  var openFieldDialog = require('openFieldDialog');
  var leaveConfirmator = require('navigation/confirmLeaveEditor');
  var metadataDialog = require('contentTypeEditor/metadataDialog');
  var Command = require('command');
  var accessChecker = require('accessChecker');
  var ctHelpers = require('data/ContentTypes');
  var eiHelpers = require('editingInterfaces/helpers');
  var spaceContext = require('spaceContext');
  var editingInterfaces = spaceContext.editingInterfaces;
  var Analytics = require('analytics/Analytics');
  var createActions = require('app/ContentModel/Editor/Actions').default;

  var contentTypeIds = spaceContext.cma.getContentTypes().then(function (response) {
    return response.items.map(function (ct) {
      return ct.sys.id;
    });
  });

  var canEdit = accessChecker.can('update', 'ContentType');
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

  $scope.goTo = function (stateName) {
    $state.go('^.' + stateName);
  };

  $scope.context.requestLeaveConfirmation = leaveConfirmator($scope.actions.saveAndClose);
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty', setDirtyState);
  $scope.$watch('context.isNew', setDirtyState);

  $scope.$watch(function () {
    return $scope.contentType.getName();
  }, function (title) {
    $scope.context.title = title;
  });

  $scope.$watch('contentType.data.fields', function (newVal, oldVal) {
    checkForDirtyForm(newVal, oldVal);
  }, true);

  $scope.$watch('contentType.data.fields.length', function (length) {
    $scope.hasFields = length > 0;
    ctHelpers.assureDisplayField($scope.contentType.data);
    setDirtyState();
    $scope.data.fieldsUsed = length;
  });

  if ($scope.context.isNew) {
    metadataDialog.openCreateDialog(contentTypeIds)
    .then(applyContentTypeMetadata(true), function () {
      $state.go('spaces.detail.content_types.list');
    });
  }

  function applyContentTypeMetadata (withId) {
    return function (metadata) {
      var data = $scope.contentType.data;
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
  controller.getPublishedField = function (id) {
    var publishedFields = _.get($scope.publishedContentType, 'data.fields', []);
    return _.cloneDeep(_.find(publishedFields, {id: id}));
  };

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#removeField
   * @param {string} id
   */
  controller.removeField = function (id) {
    var fields = $scope.contentType.data.fields;
    _.remove(fields, {id: id});
    syncEditingInterface();
  };

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#openFieldDialog
   * @param {Client.ContentType.Field} field
   */
  controller.openFieldDialog = function (field) {
    var control = eiHelpers.findWidget($scope.editingInterface.controls, field);
    return openFieldDialog($scope, field, control)
    .then(function () {
      $scope.contentTypeForm.$setDirty();
    });
  };

  function checkForDirtyForm (newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.contentTypeForm.$setDirty();
    }
  }

  function setDirtyState () {
    var modified = $scope.contentTypeForm.$dirty;
    if (modified === true && $scope.context.isNew && $scope.contentType.data.fields.length < 1) {
      modified = false;
    }
    $scope.context.dirty = !!modified;
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#$scope.showMetadataDialog
  */
  $scope.showMetadataDialog = Command.create(function () {
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
  $scope.showNewFieldDialog = Command.create(function () {
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
    var data = $scope.contentType.data;
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
