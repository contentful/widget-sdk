import { registerDirective } from 'NgRegistry.es6';

import createEditorController from 'app/entity_editor/EntryController.es6';

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
