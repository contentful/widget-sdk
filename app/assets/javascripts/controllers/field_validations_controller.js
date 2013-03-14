angular.module('contentful/controllers').controller('FieldValidationsCtrl', function($scope) {
  'use strict';

  $scope.availableValidations= {
    size: 'Size',
    range: 'Range',
    regexp: 'Regular Expression',
    in: 'One of'
  };

  $scope.prepareNewValidation = function () {
    $scope.newValidation = {};
    $scope.newValidation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    var fieldDoc = $scope.doc.at(['fields', $scope.index]);
    var callback = function () {
      $scope.$apply(function (scope) {
        scope.prepareNewValidation();
      });
    };

    if (!fieldDoc.get().validations) {
      fieldDoc.at(['validations']).set([$scope.newValidation], callback);
    } else {
      var validationsDoc = $scope.doc.at(['fields', $scope.index, 'validations']);
      var numValidations = validationsDoc.get().length;
      validationsDoc.insert(numValidations, $scope.newValidation, callback);
    }
  };

  $scope.deleteValidation = function (validation) {
    var validationIndex = _.indexOf($scope.validations(), validation);
    $scope.doc.at(['fields', $scope.index, 'validations', validationIndex]).remove(function(){
      $scope.$apply();
    });

  };

  $scope.$watch(function (scope) {
    return scope.validationsFromDoc();
  }, function (validations, old, scope) {
    scope.validations = validations;
  }, true);

  $scope.validationsFromDoc = function(){
    return $scope.doc.getAt(['fields', $scope.index, 'validations']) || [];
  };

  $scope.validationType = function (validation) {
    return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
  };
});
