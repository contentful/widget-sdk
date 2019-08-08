import { registerDirective } from 'NgRegistry.es6';

import createEditorController from 'app/entity_editor/EntryController.es6';

export default function register() {
  registerDirective('cfEntryEditor', [
    () => ({
      restrict: 'E',

      scope: {
        editorData: '<',
        preferences: '<',
        trackLoadEvent: '<'
      },

      template: JST.entry_editor(),

      controller: [
        '$scope',
        $scope =>
          createEditorController(
            $scope,
            $scope.editorData,
            $scope.preferences,
            $scope.trackLoadEvent
          )
      ]
    })
  ]);
}
