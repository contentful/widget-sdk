import { registerController } from 'NgRegistry';

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
