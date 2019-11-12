import { registerDirective } from 'NgRegistry';

import createEditorController from 'app/entity_editor/AssetController';

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
