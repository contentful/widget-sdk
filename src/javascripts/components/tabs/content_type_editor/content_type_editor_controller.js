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
  var $q                = $injector.get('$q');
  var analytics         = $injector.get('analytics');
  var validation        = $injector.get('validation');
  var hints             = $injector.get('hints');
  var editingInterfaces = $injector.get('editingInterfaces');
  var modalDialog       = $injector.get('modalDialog');
  var openFieldDialog   = $injector.get('openFieldDialog');

  $scope.actions = $controller('ContentTypeActionsController', {$scope: $scope});

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

  $scope.$watch('contentType.data.fields',       checkForDirtyForm, true);
  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty',        setDirtyState);
  $scope.$watch('context.isNew',                 setDirtyState);

  $scope.$watch('contentType.data.fields.length', function(length, old) {
    $scope.hasFields = length > 0;
    assureTitleField(length-old > 0 ? 'add' : 'delete');
    setDirtyState();
  });

  var fieldDeletionNotification =
    '<p>Please remove all entries linked to this content type before trying to delete ' +
    'a field. Fields can only be deleted on content types that have no entries ' +
    'associated with them.</p>' +
    '<p>To simply stop a field from appearing on the entry editor interface, disable it. ' +
    'Disabling fields can be done at any time regardless of number of associated entries.</p>';

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    scope.publishedApiNames = _.pluck(fields, 'apiName');
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
    var publishedFields = dotty.get($scope.publishedContentType, 'data.fields');
    var isPublished = _.any(publishedFields, {id: id});
    var isDeletable;

    if (isPublished) {
      isDeletable = this.countEntries().then(function (count) {
        return !count;
      });
    } else {
      isDeletable = $q.when(true);
    }

    isDeletable.then(function (deletable) {
      if (!deletable) {
        modalDialog.notify(fieldDeletionNotification, {html: true});
      } else {
        var fields = $scope.contentType.data.fields;
        _.remove(fields, {id: id});
      }
    });
  };

  // TODO This should b a service. It is here because the
  // ContentTypeActionsController needs it, too.
  controller.countEntries = function () {
    if (!$scope.contentType.getPublishedVersion()) {
      return $q.when(0);
    }
    return $scope.spaceContext.space.getEntries({
      content_type: $scope.contentType.data.sys.id
    }).then(function(response) {
      return response.length;
    });
  };

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#openFieldDialog
   * @param {Client.ContentType.Field} field
   */
  controller.openFieldDialog = function (field) {
    return openFieldDialog($scope, field)
    .then(function () {
      $scope.contentTypeForm.$setDirty();
    });
  };

  function checkForDirtyForm(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.contentTypeForm.$setDirty();
    }
  }

  function setDirtyState() {
    var modified = $scope.contentTypeForm.$dirty;
    if (modified === true && $scope.context.isNew && $scope.contentType.data.fields.length < 1) {
      modified = false;
    }
    $scope.context.dirty = !!modified;
  }

  function handleEntityDeleted(event, contentType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (contentType === scope.contentType) {
        scope.closeState();
      }
    }
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
      ignoreEnter: true
    }).promise
    .then(addField);
  }

  function addField(newField) {
    var data = $scope.contentType.data;
    data.fields = data.fields || [];
    data.fields.push(newField);
    $scope.$broadcast('fieldAdded', data.fields.length - 1);
    syncEditingInterface();
    analytics.modifiedContentType('Modified ContentType', $scope.contentType, newField, 'add');
  }

  /**
   * Make sure that each field has a widget and vice versa.
   */
  function syncEditingInterface () {
    editingInterfaces.syncWidgets($scope.contentType, $scope.editingInterface);
  }

  /**
   * Accounts for displayField value inconsistencies for content types which existed
   * before the internal apiName content type property.
   */
  function regulateDisplayField() {
    var data = $scope.contentType.data;
    var valid = _.isUndefined(data.displayField) || data.displayField === null || hasFieldUsedAsTitle();
    if (!valid) {
      data.displayField = null;
    }
  }

  /**
   * Checks if on the list of fields there is a object with id that is currently set
   * on Content Type as a "displayField" property
   */
  function hasFieldUsedAsTitle() {
    var data = $scope.contentType.data;
    return _.any(data.fields, {id: data.displayField});
  }

  /**
   * If there's no field selected as a title, use first found
   */
  function assureTitleField(action) {
    var data = $scope.contentType.data;
    var usableFields = findFieldsUsableAsTitle();

    // this the first usable field added
    if (action === 'add' && usableFields.length === 1) {
      data.displayField = usableFields.shift();
    }

    // deleted field was used as title
    if (action === 'delete' && data.displayField && !hasFieldUsedAsTitle()) {
      data.displayField = usableFields.shift();
    }
  }

  function findFieldsUsableAsTitle() {
    return  _($scope.contentType.data.fields).
      filter(isUsable).
      pluck('id').
      value();

    function isUsable(field) {
      return _.contains(['Symbol', 'Text'], field.type) && !field.disabled;
    }
  }
}]);
