'use strict';

angular.module('contentful').controller('FieldValidationsController', function($scope, analytics, validation, notification) {
  var field = $scope.field.type === 'Array' ?
    $scope.field.items:
    $scope.field;
  var typeValidations = validation.Validation.perType(field);

  var validations = {
    'Size': {size: {min: null, max: null}},
    'Range': {range: {min: null, max: null}},
    'Regular Expression': {regexp: {pattern: null, flags: null}},
    'One of': {'in': null} ,
    'Content Type': {linkContentType: null},
    'File Type': {linkMimetypeGroup: null}
  };

  $scope.availableValidations = _.pick(validations, function(val) {
    var key = validationType(val);
    return _.contains(typeValidations, key);
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

  $scope.addValidation = function () {
    var validation = _.find($scope.availableValidations);
    if (!validation) return notification.info('No Validations available');

    var doc = $scope.getValidationListDoc();
    if (doc.get()) {
      doc.push(validation, function (err) {
        $scope.$apply(function (scope) {
          if (err) {
            notification.error('Could not add validation');
          } else {
            scope.updateValidationsFromDoc();
          }
        });
      });
    } else {
      doc.set([validation], function (err) {
        $scope.$apply(function (scope) {
          if (err) {
            notification.error('Could not add validation');
          } else {
            scope.updateValidationsFromDoc();
          }
        });
      });
    }
  };

  $scope.validationType = validationType;
  $scope.validationName = validationName;

  $scope.updateValidationsFromDoc = function () {
    if ($scope.field.type == 'Array') {
      $scope.field.items.validations = $scope.getValidationListDoc().get();
    } else {
      $scope.field.validations = $scope.getValidationListDoc().get();
    }
  };

  function validationType(validation) {
    return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
  }

  function validationName(validation) {
    var type = validationType(validation);
    return _(validations).findKey(function (val) {
      return val.hasOwnProperty(type);
    });
  }
});
