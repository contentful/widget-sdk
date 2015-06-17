'use strict';

/**
 * @ngdoc type
 * @name ContentTypeEditorController
 *
 * @scope.requires  context
 * @scope.requires  $state
 * @scope.requires  spaceContext
 * @scope.requires  contentTypeForm
 *
 * @scope.provides  contentType
 * @scope.provides  entityActionsController
 * @scope.provides  hasFields
 * @scope.provides  publishedIds
 * @scope.provides  publishedApiNames
 * @scope.provides  publishedContentType
*/
angular.module('contentful')
.controller('ContentTypeEditorController', ['$scope', '$injector',
function ContentTypeEditorController($scope, $injector) {
  var controller        = this;
  var $controller       = $injector.get('$controller');
  var analytics         = $injector.get('analytics');
  var validation        = $injector.get('validation');
  var hints             = $injector.get('hints');
  var editingInterfaces = $injector.get('editingInterfaces');
  var modalDialog       = $injector.get('modalDialog');

  $scope.entityActionsController = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'contentType'
  });

  $scope.hints = hints;

  $scope.context.closingMessage = [
    'You edited the Content Type but didn\'t save your changes.',
    'Please either save or discard them'
  ];

  $scope.fieldSchema                        = validation(validation.schemas.ContentType.at(['fields']).items);
  $scope.regulateDisplayField               = regulateDisplayField;
  $scope.updatePublishedContentType         = updatePublishedContentType;
  $scope.showMetadataDialog                 = showMetadataDialog;
  $scope.showNewFieldDialog                 = showNewFieldDialog;

  $scope.$watch('contentType', loadContentType);
  $scope.$watch('contentType.data.fields',       checkForDirtyForm, true);
  $scope.$watch('contentType.data.displayField', checkForDirtyForm);

  $scope.$watch('contentTypeForm.$dirty', function (modified) {
    reloadPublisedContentType(modified);
    $scope.context.dirty = modified;
  });

  $scope.$watch('contentType.data.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    scope.publishedApiNames = _.pluck(fields, 'apiName');
  });

  $scope.$watch(function contentTypeModifiedWatcher() {
    return contentTypeIsDirty() || $scope.contentTypeForm.$dirty;
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.context.dirty = modified;
  });

  $scope.$on('entityDeleted', handleEntityDeleted);

  if($scope.context.isNew){
    showMetadataDialog({
      optionalTitle: 'Create a new Content Type',
      optionalActionLabel: 'Create'
    })
    .catch(function () {
      $scope.$state.go('^.list');
    });
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#deleteField
   * @param {string} id
   */
  controller.deleteField = function (id) {
    modalDialog.confirmDeletion(
      'You’re about to delete this field.',
      'Please remember that you won’t be able to delete ' +
      'fields once the content type is published.'
    ).then(function () {
      var fields = $scope.contentType.data.fields;
      _.remove(fields, {id: id});
    });
  };

  function loadContentType(contentType) {
    $scope.contentType = contentType;
    if (!_.isEmpty($scope.contentType.data.fields)) $scope.validate();
    loadPublishedContentType();
  }

  function reloadPublisedContentType(dirty){
    if (dirty){
      loadPublishedContentType();
    }
  }

  function checkForDirtyForm(newVal, oldVal) {
    if(newVal !== oldVal) {
      $scope.contentTypeForm.$setDirty();
    }
  }

  function loadPublishedContentType() {
    // TODO replace with lookup in registry inside spaceContext
    $scope.contentType.getPublishedStatus()
    .then(function(publishedContentType){
      $scope.publishedContentType = publishedContentType;
    });
  }

  function contentTypeIsDirty() {
    return $scope.contentType && $scope.contentType.getVersion() > $scope.contentType.getPublishedVersion() + 1;
  }

  function handleEntityDeleted(event, contentType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (contentType === scope.contentType) {
        $scope.context.dirty = false;
        scope.closeState();
      }
    }
  }

  /**
   * Accounts for displayField value inconsistencies for content types which existed
   * before the internal apiName content type property.
   */
  function regulateDisplayField() {
    var displayField = $scope.contentType.data.displayField;
    var valid = _.isUndefined(displayField) || displayField === null || _.any($scope.contentType.data.fields, {id: displayField});
    if (!valid)
      $scope.contentType.data.displayField = null;
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#scope#updatePublishedContentType
   *
   * @param {Object} publishedContentType
  */
  function updatePublishedContentType (publishedContentType) {
    $scope.publishedContentType = publishedContentType;
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#scope#showMetadataDialog
   *
   * @param {object} params
   * @property {string} optionalTitle
   * @property {string} optionalActionLabel
   *
   * @returns {Promise}
  */
  function showMetadataDialog(params) {
    params = params || {};
    $scope.contentTypeMetadata = {
      name: $scope.contentType.data.name || '',
      description: $scope.contentType.data.description || ''
    };
    return modalDialog.open({
      title: params.optionalTitle || 'Edit Content Type',
      confirmLabel: params.optionalActionLabel || 'Confirm',
      template: 'edit_content_type_metadata_dialog',
      noBackgroundClose: true,
      scope: $scope,
      ignoreEnter: true
    }).promise
    .then(function () {
      _.extend($scope.contentType.data, $scope.contentTypeMetadata);
      $scope.contentTypeForm.$setDirty();
    });
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#scope#showNewFieldDialog
  */
  function showNewFieldDialog() {
    modalDialog.open({
      template: 'add_field_dialog',
      noBackgroundClose: true,
      scope: $scope,
      ignoreEnter: true,
    }).promise
    .then(addField);
  }

  function addField(newField) {
    if(!_.has($scope.contentType.data, 'fields'))
      $scope.contentType.data.fields = [];
    $scope.contentType.data.fields.push(newField);
    $scope.$broadcast('fieldAdded', $scope.contentType.data.fields.length - 1);
    syncEditingInterface();
    analytics.modifiedContentType('Modified ContentType', $scope.contentType, newField, 'add');
  }

  /**
   * Make sure that each field has a widget and vice versa.
   */
  function syncEditingInterface () {
    editingInterfaces.syncWidgets($scope.contentType, $scope.editingInterface);
  }
}]);
