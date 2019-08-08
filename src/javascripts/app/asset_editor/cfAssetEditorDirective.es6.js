import { registerDirective } from 'NgRegistry.es6';

import createEditorController from 'app/entity_editor/AssetController.es6';

export default function register() {
  registerDirective('cfAssetEditor', [
    () => ({
      restrict: 'E',

      scope: {
        editorData: '<',
        preferences: '<'
      },

      template: JST.asset_editor(),

      controller: [
        '$scope',
        $scope => createEditorController($scope, $scope.editorData, $scope.preferences)
      ]
    })
  ]);
}
