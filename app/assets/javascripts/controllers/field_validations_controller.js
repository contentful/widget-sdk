angular.module('contentful/controllers').controller('FieldValidationsCtrl', function($scope) {
  'use strict';

  $scope.availableValidations= [
    {name: 'size'  , title: 'Size'},
    {name: 'range' , title: 'Range'},
    {name: 'regexp', title: 'Regular Expression'},
    {name: 'in'    , title: 'One of'},
  ];

  $scope.prepareNewValidation = function () {
    $scope.newValidation = {};
    $scope.newValidation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    $scope.field.validations = $scope.field.validations || [];
    $scope.field.validations.push($scope.newValidation);
    $scope.prepareNewValidation();
  };
});
