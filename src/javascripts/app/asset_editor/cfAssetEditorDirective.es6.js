import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfAssetEditor', [
    'app/entity_editor/AssetController.es6',
    ({ default: createEditorController }) => ({
      restrict: 'E',
      scope: {
        assetId: '<',
        preferences: '<'
      },
      template: JST.asset_editor(),
      controller: ['$scope', $scope => createEditorController($scope, $scope.assetId)]
    })
  ]);
}
