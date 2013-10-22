angular.module('contentful').controller('CfFieldSettingsCtrl', function ($scope, getFieldTypeName, analytics, validation, assert, notification, toIdentifier, validationDialog) {
  'use strict';

  $scope.$watch(function (scope) {
    var f = scope.field;
    return _.isEmpty(f.validations) && _.isEmpty(f.items && f.items.validations);
  }, function (noValidations, old, scope) {
    scope.hasValidations = !noValidations;
  });

  $scope.$watch('fieldTypeParams(field)', function (typeParams, old, scope) {
    scope.validationsAvailable = !_.isEmpty(validation.Validation.perType($scope.field));
  }, true);

  $scope.getFieldTypeName = getFieldTypeName;

  $scope.statusTooltipText = function () {
    if ($scope.published)
      if ($scope.field.disabled)
        return 'Disabled - this Field is not shown to editors by default.';
      else
        return 'Active - this Field is visible to editors.';
    else
      return 'New - this Field is new and the Content Type needs to be activated again to make it available for editors.';
  };

  $scope.statusClass = function () {
    if ($scope.published)
      if ($scope.field.disabled)
        return 'disabled';
      else
        return 'published';
    else
      return 'unpublished';
  };

  $scope.displayEnabled = function () {
    return $scope.field.type === 'Symbol' || $scope.field.type === 'Text';
  };

  $scope.isDisplayField = function () {
    return $scope.contentType.data.displayField === $scope.field.id;
  };

  $scope.displayedFieldName = function () {
    return _.isEmpty($scope.field.name) ?
             _.isEmpty($scope.field.id) ?  'Untitled field' : 'ID: '+$scope.field.id
           : $scope.field.name;
  };

  $scope.$watch('fieldIsPublished(field)', function(published, old, scope) {
    scope.published = published;
  });

  $scope.openValidations = function () {
    validationDialog.open($scope);
  };

  var oldName = $scope.field.name || '';
  $scope.updateFieldId = function () {
    var currentId = $scope.field.id || '';
    if (!$scope.published && toIdentifier(oldName) == currentId){
      otUpdateFieldId($scope.field.name ? toIdentifier($scope.field.name) : '');
    }
    oldName = $scope.field.name || '';
  };

  function otUpdateFieldId(newId) {
    var isDisplayField = $scope.isDisplayField();
    $scope.field.id = newId;

    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, 'id']);
    subdoc.set(newId, function(err) {
      $scope.$apply(function (scope) {
        if (err) {
          scope.field.id = subdoc.get();
          notification.serverError('Error updating ID', err);
          return;
        }
        if (isDisplayField ||
            _.isEmpty($scope.contentType.data.displayField) && $scope.displayEnabled()) {
          $scope.setDisplayField($scope.field);
        }
      });
    });
  }

  $scope.changeFieldType = function (newType) {
    if (!$scope.otDoc) return false;

    var newField = _.extend({
      name: $scope.field.name,
      id: $scope.field.id,
      uiid: $scope.field.uiid
    }, newType);

    var subdoc = $scope.otDoc.at(['fields', $scope.index]);
    subdoc.set(newField, function(err) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.otUpdateEntity();
        } else {
          notification.serverError('Could not change type.', err);
        }
      });
    });
  };

  $scope.toggle = function(property) {
    assert.truthy(property, 'need a property to toggle');
    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, property]);
    subdoc.set(!subdoc.get(), function(err) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.field[property] = subdoc.get();
          analytics.modifiedContentType('Modified ContentType', scope.contentType, scope.field, 'toggled '+property);
        } else {
          notification.serverError('Could not toggle "'+property+'"', err);
        }
      });
    });
  };

  $scope['delete'] = function() {
    if (!$scope.otDoc) return false;
    var field = $scope.field;
    $scope.otDoc.at(['fields', $scope.index]).remove(function (err) {
      if (!err) $scope.$apply(function(scope) {
        analytics.modifiedContentType('Modified ContentType', scope.contentType, field, 'delete');
        scope.otUpdateEntity();
        scope.$emit('fieldDeleted', field);
      });
    });
  };

});
