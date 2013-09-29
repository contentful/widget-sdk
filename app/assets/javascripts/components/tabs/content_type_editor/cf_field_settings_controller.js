'use strict';

angular.module('contentful').controller('CfFieldSettingsCtrl', function ($scope, getFieldTypeName, analytics, validation, assert, notification, toIdentifier, validationDialog) {
  $scope.newFieldId = {
    value: $scope.field.id,
    isInUse: function () {
      var self = this;
      return !!_.find($scope.contentType.data.fields, function (field) {
        return field != $scope.field && field.id === self.value;
      });
    },
    isPristine: function (){
      return this.value === $scope.field.id;
    },
    canBeSaved: function () {
      return !this.isInUse() && !this.isPristine();
    }
  };

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

  $scope.$watch('publishedIds', function(ids, old, scope) {
    scope.published = scope.fieldIsPublished(scope.field);
  });

  $scope.openValidations = function () {
    validationDialog.open($scope);
  };

  var oldName = $scope.field.name || '';
  $scope.nameToNewFieldId = function () {
    var currentNewId = $scope.newFieldId.value || '';
    if (toIdentifier(oldName) == currentNewId){
      $scope.newFieldId.value = toIdentifier($scope.field.name);
    }
    oldName = $scope.field.name || '';
  };

  $scope.saveNewFieldId = function () {
    if (!$scope.otDoc) return false;
    var subdoc = $scope.otDoc.at(['fields', $scope.index, 'id']);
    subdoc.set($scope.newFieldId.value, function(err) {
      $scope.$apply(function (scope) {
        if (err) {
          notification.error('Error updating ID');
        } else {
          scope.field.id = scope.newFieldId.value;
        }
      });
    });
  };

  $scope.$watch('field.id', function (fieldId, old, scope) {
    // FieldId updated from outside
    if (fieldId !== scope.newFieldId.value)
      scope.newFieldId.value = fieldId;
  });

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
}).directive('newFieldIdInputx', function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attr, ngModel) {
      scope.newFieldId.isPristine = function () {
        return ngModel.$pristine;
      };

      scope.newFieldId.isInUse = function () {
        return ngModel.$error.idInUse;
      };

      scope.newFieldId.canBeSaved = function () {
        return !this.isInUse() && !this.isPristine();
      };

      scope.newFieldId.setPristine = function () {
        ngModel.$setPristine();
      };

      ngModel.$parsers.push(function (viewValue) {
        updateValidity();
        return viewValue;
      });

      ngModel.$formatters.push(function (modelValue) {
        if (modelValue === scope.field.id) ngModel.$setPristine();
        updateValidity();
        return modelValue;
      });

      function updateValidity() {
        var inUse = !_.find(scope.contentType.data.fields, {id: scope.newFieldId.value});
        ngModel.$setValidity('idInUse', !inUse);
      }
    }
  };
});


