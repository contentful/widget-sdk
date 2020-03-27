import { registerDirective } from 'NgRegistry';

import createEditorController from 'app/entity_editor/EntryController';
import entryEditorTemplate from './entry_editor.html';

export default function register() {
  registerDirective('cfEntryEditor', [
    () => ({
      restrict: 'E',

      scope: {
        editorData: '<',
        preferences: '<',
        trackLoadEvent: '<',
      },

      template: entryEditorTemplate,

      controller: [
        '$scope',
        ($scope) =>
          createEditorController(
            $scope,
            $scope.editorData,
            $scope.preferences,
            $scope.trackLoadEvent
          ),
      ],
    }),
  ]);
}
