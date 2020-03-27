import { registerDirective } from 'NgRegistry';

import createEditorController from 'app/entity_editor/AssetController';
import assetEditorTemplate from './asset_editor.html';

export default function register() {
  registerDirective('cfAssetEditor', [
    () => ({
      restrict: 'E',

      scope: {
        editorData: '<',
        preferences: '<',
      },

      template: assetEditorTemplate,

      controller: [
        '$scope',
        ($scope) => createEditorController($scope, $scope.editorData, $scope.preferences),
      ],
    }),
  ]);
}
