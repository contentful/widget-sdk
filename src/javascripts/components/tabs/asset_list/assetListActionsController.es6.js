import { registerController } from 'NgRegistry.es6';

registerController('AssetListActionsController', [
  '$scope',
  '$controller',
  function AssetListActionsController($scope, $controller) {
    $controller('ListActionsController', {
      $scope: $scope,
      entityType: 'Asset'
    });
  }
]);
