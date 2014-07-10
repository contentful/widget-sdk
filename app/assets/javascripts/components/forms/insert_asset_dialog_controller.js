'use strict';
angular.module('contentful').controller('InsertAssetDialogController', ['$scope', '$injector', function($scope, $injector){
  var keycodes = $injector.get('keycodes');

  $scope.entities = [];
  $scope.selectAsset = function (asset) {
    $scope.dialog.confirm(asset);
  };

  $scope.handleKeys = function (event) {
    if (event.keyCode === keycodes.ENTER) event.stopPropagation();
  };
}]);
