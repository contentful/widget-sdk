import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfEntryEditor', [
    'app/entity_editor/EntryController.es6',
    ({ default: createEditorController }) => ({
      restrict: 'E',
      scope: {
        editorData: '<',
        entryId: '<',
        preferences: '<',
        slideStates: '<'
      },
      template: JST.entry_editor(),
      controller: [
        '$scope',
        $scope => createEditorController($scope, $scope.editorData, $scope.preferences)
      ]
    })
  ]);
}
