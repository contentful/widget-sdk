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
 */
angular.module('contentful')
.controller('ContentTypeEditorController', ['$scope', '$injector', function ContentTypeEditorController ($scope, $injector) {
  var controller = this;
  var $controller = $injector.get('$controller');
  var $state = $injector.get('$state');
  var validation = $injector.get('validation');
  var hints = $injector.get('ContentTypeEditorController/hints')();
  var modalDialog = $injector.get('modalDialog');
  var openFieldDialog = $injector.get('openFieldDialog');
  var leaveConfirmator = $injector.get('navigation/confirmLeaveEditor');
  var metadataDialog = $injector.get('contentTypeEditor/metadataDialog');
  var Command = $injector.get('command');
  var accessChecker = $injector.get('accessChecker');
  var ctHelpers = $injector.get('data/ContentTypes');
  var eiHelpers = $injector.get('editingInterfaces/helpers');
  var spaceContext = $injector.get('spaceContext');
  var editingInterfaces = spaceContext.editingInterfaces;
  var trackContentTypeChange = $injector.get('analyticsEvents').trackContentTypeChange;

  $scope.actions = $controller('ContentTypeActionsController', {$scope: $scope});

  $scope.$state = $state;

  $scope.hints = hints;

  $scope.context.requestLeaveConfirmation = leaveConfirmator($scope.actions.saveAndClose);
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('contentType.data.displayField', checkForDirtyForm);
  $scope.$watch('contentTypeForm.$dirty', setDirtyState);
  $scope.$watch('context.isNew', setDirtyState);

  $scope.$watch('contentType.data.fields', function (newVal, oldVal) {
    checkForDirtyForm(newVal, oldVal);
    hints.updateFields(newVal);
  }, true);

  $scope.$watch('contentType.data.fields.length', function (length) {
    $scope.hasFields = length > 0;
    ctHelpers.assureDisplayField($scope.contentType.data);
    setDirtyState();
  });

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
   * @name ContentTypeEditorController#registerPublishedFields
   * @param {Client.ContentType} contentType
   */
  controller.registerPublishedFields = registerPublishedFields;

  var publishedFields = [];
  registerPublishedFields($scope.publishedContentType);

  function registerPublishedFields (contentType) {
    publishedFields = _.cloneDeep(dotty.get(contentType, 'data.fields', []));
  }

  /**
   * @ngdoc method
   * @name ContentTypeEditorController#getPublishedField
   * @param {string} id
   */
  controller.getPublishedField = function (id) {
    return _.find(publishedFields, {id: id});
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
    trackContentTypeChange('Modified ContentType', $scope.contentType, newField, 'add');
  }

  /**
   * Make sure that each field has a widget and vice versa.
   */
  function syncEditingInterface () {
    editingInterfaces.syncControls($scope.contentType.data, $scope.editingInterface);
  }
}])

.factory('ContentTypeEditorController/hints', ['$injector', function ($injector) {

  var hints = $injector.get('hints');

  return function prepareContentTypeHints () {
    var fieldPropertyCounts = countFieldProperties([]);

    return {
      updateFields: function (fields) {
        fieldPropertyCounts = countFieldProperties(fields);
      },
      shouldShow: shouldShowHint,
      dismiss: dismissHint,
      lifecycle: {
        shouldShow: function (id) {
          return shouldShowLifecycleHint(fieldPropertyCounts, id);
        },
        dismiss: dismissLifecycleHint
      }
    };
  };

  function shouldShowLifecycleHint (propertyCounts, id) {
    var pc = propertyCounts;
    var shouldShow = shouldShowHint(getLifecycleHintId(id));

    switch (id) {
      case 'neutral':
        return shouldShow && pc.omitted < 1 && pc.disabled < 1;
      case 'disabled':
        return shouldShow && pc.both < 1 && pc.disabled > 0;
      case 'omitted':
        return shouldShow && pc.both < 1 && pc.omitted > 0;
      case 'both':
        return shouldShow && pc.both > 0;
      default:
        return false;
    }
  }

  function dismissLifecycleHint (id) {
    dismissHint(getLifecycleHintId(id));
  }

  function shouldShowHint (id) {
    return hints.shouldShow(id);
  }

  function dismissHint (id) {
    hints.setAsSeen(id);
  }

  function getLifecycleHintId (id) {
    return 'ct-field-lifecycle-' + id;
  }

  function countFieldProperties (fields) {
    return _.transform(fields, function (acc, field) {
      if (field.disabled) { acc.disabled += 1; }
      if (field.omitted) { acc.omitted += 1; }
      if (field.disabled && field.omitted) { acc.both += 1; }
    }, {disabled: 0, omitted: 0, both: 0});
  }
}]);
