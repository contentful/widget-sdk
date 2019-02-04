import { registerController } from 'NgRegistry.es6';

export default function register() {
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
}
