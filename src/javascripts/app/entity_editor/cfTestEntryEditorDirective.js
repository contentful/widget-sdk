import { registerDirective } from 'NgRegistry';

import createEditorController from 'app/entity_editor/EntryController';

export default function register() {
  registerDirective('cfTestEntryEditor', [
    () => ({
      restrict: 'E',
      scope: true,
      template: JST.entry_editor(),
      controller: ['$scope', createEditorController]
    })
  ]);
}
