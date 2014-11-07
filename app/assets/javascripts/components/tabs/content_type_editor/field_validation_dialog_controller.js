'use strict';

angular.module('contentful').controller('FieldValidationDialogController', ['$scope', 'analytics', 'availableValidations', 'notification', function($scope, analytics, availableValidations, notification) {
  $scope.validationType = availableValidations.type;
  $scope.validationName = availableValidations.name;

  function validationUsed(availableValidation) {
    return !!_.find($scope.validationList(), function (existingValidation) {
      return vType(existingValidation) === vType(availableValidation);
    });
  }

  function vType(v) {
    return availableValidations.type(v);
  }

  $scope.$watchCollection('validationList()', function (validationList, old, scope) {
    var fieldValidations = availableValidations.forField(scope.field);
    scope.availableValidations = _.omit(fieldValidations, validationUsed);
  });

  $scope.validationListPath = function() {
    var args = [].splice.call(arguments,0);
    if ($scope.field.type == 'Array') {
      return _.flatten(['fields', $scope.index, 'items', 'validations'].concat(args));
    } else {
      return _.flatten(['fields', $scope.index, 'validations'].concat(args));
    }
  };

  $scope.validationList = function () {
    if ($scope.field.type == 'Array') {
      return $scope.field.items.validations;
    } else {
      return $scope.field.validations;
    }
  };

  $scope.getValidationDoc = function (validationIndex) {
    if (!angular.isDefined(validationIndex)) throw new Error('No validationIndex');
    return $scope.otDoc.at($scope.validationListPath(validationIndex));
  };

  $scope.getValidationListDoc = function () {
    return $scope.otDoc.at($scope.validationListPath());
  };

  $scope.deleteValidation = function (validationIndex) {
    $scope.getValidationDoc(validationIndex).remove(function(err){
      if (!err) $scope.$apply(function (scope) {
        var validation = $scope.validationList()[validationIndex];
        scope.validationList().splice(validationIndex, 1);
        analytics.track('Deleted Validation', {
          fieldId: scope.field.id,
          validationType: $scope.validationType(validation)
        });
      });
    });
  };

  $scope.addValidation = function (validation) {
    var doc = $scope.getValidationListDoc();
    if (doc.get()) {
      doc.push(validation, function (err) {
        $scope.$apply(function (scope) {
          if (err) {
            notification.serverError('Could not add validation', err);
          } else {
            scope.updateValidationsFromDoc();
          }
        });
      });
    } else {
      doc.set([validation], function (err) {
        $scope.$apply(function (scope) {
          if (err) {
            notification.serverError('Could not add validation', err);
          } else {
            scope.updateValidationsFromDoc();
          }
        });
      });
    }
  };

  $scope.updateValidationsFromDoc = function () {
    if ($scope.field.type == 'Array') {
      $scope.field.items.validations = $scope.getValidationListDoc().get();
    } else {
      $scope.field.validations = $scope.getValidationListDoc().get();
    }
  };

  $scope.canAddValidations = function () {
    return $scope.permissionController.can('create', 'ContentType').can && !_.isEmpty($scope.availableValidations);
  };

}]);
