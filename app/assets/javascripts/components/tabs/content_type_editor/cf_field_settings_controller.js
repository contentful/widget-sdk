angular.module('contentful').controller('CfFieldSettingsCtrl', function ($scope, getFieldTypeName, analytics, validation, assert, notification, toIdentifier, validationDialog) {
  'use strict';

  $scope.$watch(function (scope) {
    var f = scope.field;
    return _.isEmpty(f.validations) && _.isEmpty(f.items && f.items.validations);
  }, function (noValidations, old, scope) {
    scope.hasValidations = !noValidations;
  });

  $scope.$watch(function (scope) {
    var f = scope.field;
    var params = [f.type, f.linkType];
    if (f.items) params.push(f.items.type, f.items.linkType);
    return params;
  }, function (typeParams, old, scope) {
    scope.validationsAvailable = !_.isEmpty(validation.Validation.perType($scope.field));
  }, true);

  $scope.getFieldTypeName = getFieldTypeName;

  $scope.displayEnabled = function () {
    return $scope.field.type === 'Symbol' || $scope.field.type === 'Text';
  };

  $scope.isDisplayField = function () {
    return $scope.contentType.data.displayField === $scope.field.id;
  };

  $scope.$watch('publishedIds', function(ids, old, scope) {
    scope.published = scope.fieldIsPublished(scope.field);
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
    $scope.field.id = newId;

    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, 'id']);
    subdoc.set(newId, function(err) {
      $scope.$apply(function (scope) {
        if (err) {
          scope.field.id = subdoc.get();
          notification.error('Error updating ID');
        }
      });
    });
  }

  $scope.changeFieldType = function (newType) {
    if (!$scope.otDoc) return false;

    var newField = _.extend({
      name: $scope.field.name,
      id: $scope.field.id
    }, newType);

    var subdoc = $scope.otDoc.at(['fields', $scope.index]);
    subdoc.set(newField, function(err) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.otUpdateEntity();
        } else {
          notification.error('Could not change type.');
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
          notification.error('Could not toggle "'+property+'"');
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
