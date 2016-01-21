'use strict';

/**
 * @ngdoc type
 * @name ContentTypeEditorController
 *
 * @scope.requires  context
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
  var $state            = $injector.get('$state');
  var validation        = $injector.get('validation');
  var hints             = $injector.get('hints');
  var editingInterfaces = $injector.get('editingInterfaces');
  var modalDialog       = $injector.get('modalDialog');
  var openFieldDialog   = $injector.get('openFieldDialog');
  var leaveConfirmator  = $injector.get('navigation/confirmLeaveEditor');
  var metadataDialog    = $injector.get('contentTypeEditor/metadataDialog');
  var Command           = $injector.get('command');
  var accessChecker     = $injector.get('accessChecker');
  var trackContentTypeChange = $injector.get('analyticsEvents').trackContentTypeChange;

  $scope.actions = $controller('ContentTypeActionsController', {$scope: $scope});

  $scope.hints = hints;

  $scope.context.requestLeaveConfirmation = leaveConfirmator($scope.actions.runSave);
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);
  $scope.regulateDisplayField = assureDisplayField;
  $scope.updatePublishedContentType = updatePublishedContentType;

  $scope.$watch('contentType.data.fields',       checkForDirtyForm, true);
  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty',        setDirtyState);
  $scope.$watch('context.isNew',                 setDirtyState);

  $scope.$watch('contentType.data.fields.length', function (length) {
    $scope.hasFields = length > 0;
    assureDisplayField($scope.contentType.data);
    setDirtyState();
  });

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    scope.publishedApiNames = _.pluck(fields, 'apiName');
  });

  $scope.$on('entityDeleted', handleEntityDeleted);

  if ($scope.context.isNew) {
    metadataDialog.openCreateDialog()
    .then(applyContentTypeMetadata(true), function () {
      $state.go('^.list');
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
        modalDialog.open({
          title: 'This field can\'t be deleted right now.',
          message: '<p>Please delete all entries linked to this content type before trying to delete a field. ' +
                   'Fields can only be deleted on content types that have no entries associated with them.</p> ' +
                   '<p>To simply stop a field from appearing on the entry editor, disable it. ' +
                   'Disabling fields can be done at any time regardless of the number of associated entries.</p>',
          cancelLabel: null,
          confirmLabel: 'Okay, got it'
        });

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

  function addField(newField) {
    var data = $scope.contentType.data;
    data.fields = data.fields || [];
    data.fields.push(newField);
    $scope.$broadcast('fieldAdded');
    syncEditingInterface();
    trackContentTypeChange('Modified ContentType', $scope.contentType, newField, 'add');
  }

  /**
   * Make sure that each field has a widget and vice versa.
   */
  function syncEditingInterface () {
    editingInterfaces.syncWidgets($scope.contentType, $scope.editingInterface);
  }

  /**
   * Mutate the Content Type data so that the 'displayField' property
   * points to a valid display field.
   *
   * If the display field was set before and valid, it is retained.
   * Otherwise the first suitable field is used.
   *
   * @param {API.ContentType} data
   */
  function assureDisplayField (contentTypeData) {
    contentTypeData.displayField = getDisplayField(contentTypeData);
  }

  /**
   * Returns true if the 'displayField' value of a Content Type points
   * to an existing field in the Content Type and the field type is
   * 'Symbol' or 'Text'
   *
   * @pure
   * @param {API.ContentType} datac
   * @returns {boolean}
   */
  function hasValidDisplayField (contentTypeData) {
    var displayField = contentTypeData.displayField;
    return _.any(contentTypeData.fields, function (field) {
      return displayField === field.id && isDisplayField(field);
    });
  }

  /**
   * If `data.displayField` does not point to an existing field, return
   * the first field usable as a display field. Otherwise returns the display
   * field.
   *
   * @pure
   * @param {API.ContentType} data
   * @returns {string?}
   */
  function getDisplayField (contentTypeData) {
    if (hasValidDisplayField(contentTypeData)) {
      return contentTypeData.displayField;
    } else {
      return findFieldUsableAsTitle(contentTypeData.fields);
    }
  }

  /**
   * Returns the ID of the first field that can be used as the
   * 'displayField'. That is a Symbol or Text fields that are not
   * disabled. Returns undefined if no display field candidate was found.
   *
   * @pure
   * @param {API.Field[]?} fields
   * @returns {string?}
   */
  function findFieldUsableAsTitle (fields) {
    return  _(fields)
      .filter(isDisplayField)
      .pluck('id')
      .value()[0];
  }

  function isDisplayField (field) {
    return _.contains(['Symbol', 'Text'], field.type) && !field.disabled;
  }
}]);
