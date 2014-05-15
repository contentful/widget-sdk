'use strict';

angular.module('contentful').controller('GettyDialogController', function($scope) {

  $scope.getty = {
    family: {},
    editorial: {}
  };

  $scope.imageFamilies = [];
  $scope.editorialImages = null;

  /*
  $scope.$watch('getty', function (getty) {
    //$scope.imageFamilies
  }, true);
  */

  $scope.showImageDetail = function (image) {
    $scope.imageDetail = image;
  };

});
