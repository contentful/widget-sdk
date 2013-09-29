'use strict';

angular.module('contentful').controller('ContentTypeFieldListCtrl', function($scope, analytics, validation, HashMap, fieldTypeEqual) {
  var _showValidations = {};
  var hashMap = new HashMap();

  $scope.showValidations = function(fieldId) {
    return !!_showValidations[fieldId];
  };

  var openFieldKey;
  $scope.toggleField = function (field) {
    var key = $scope.fieldSortKey(field);
    if (openFieldKey == key) {
      openFieldKey = null;
    } else {
      openFieldKey = key;
    }
  };

  $scope.fieldClicked =function (field) {
    if (!$scope.isFieldOpen(field)) $scope.openField(field);
  };

  $scope.openField = function (field) {
    var key = $scope.fieldSortKey(field);
    openFieldKey = key;
  };

  $scope.fieldSortKey = function (field) {
    if ($scope.fieldIsPublished(field)) {
      return field.id;
    } else {
      return hashMap.hashFor(field);
    }
  };

  $scope.fieldIsPublished = function (field) {
    return _.contains($scope.publishedIds, field.id) && fieldIsUnique(field);
  };

  function fieldIsUnique(field){
    return _.filter($scope.contentType.data.fields, function (pubField) {
      return pubField.id === field.id && fieldTypeEqual(field, pubField);
    }).length <= 1;
  }

  $scope.closeAllFields = function () {
    openFieldKey = null;
  };

  $scope.isFieldOpen = function (field) {
    var key = $scope.fieldSortKey(field);
    return openFieldKey == key;
  };

  $scope.hasValidations = function (field) {
    return !_.isEmpty(validation.Validation.perType[field.type]);
  };

  $scope.setDisplayField = function (field) {
    $scope.otDoc.at(['displayField']).set(field.id, function (err) {
      if (!err) $scope.$apply(function (scope) {
        scope.contentType.data.displayField = field.id;
      });
    });
  };

  $scope.removeDisplayField = function () {
    $scope.otDoc.at(['displayField']).set(null, function (err) {
      if (!err) $scope.$apply(function (scope) {
        scope.contentType.data.displayField = null;
      });
    });
  };

  $scope.$watch('validationResult.errors', function (errors, old, scope) {
    _.each(errors, function (error) {
      if (error.path[2] === 'validations' || error.path[3] === 'validations') {
        var fieldId = scope.contentType.data.fields[error.path[1]].id;
        _showValidations[fieldId] = true;
      }
    });
  });

  $scope.$on('fieldAdded', function (event, index) {
    var scope = event.currentScope;
    scope.openField(scope.contentType.data.fields[index]);
  });

  $scope.$on('fieldDeleted', function (event, field) {
    hashMap.remove(field);
  });

  $scope.$watch('pulishedIds', function () {
    hashMap.clear();
  });

});
