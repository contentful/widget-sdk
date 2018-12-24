'use strict';

angular.module('contentful').controller('AssetListActionsController', [
  '$scope',
  '$controller',
  function AssetListActionsController($scope, $controller) {
    $controller('ListActionsController', {
      $scope: $scope,
      entityType: 'Asset'
    });
  }
]);
