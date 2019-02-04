import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfTestEntryEditor', [
    'app/entity_editor/EntryController.es6',
    ({ default: createEditorController }) => ({
      restrict: 'E',
      scope: true,
      template: JST.entry_editor(),
      controller: ['$scope', createEditorController]
    })
  ]);
}
