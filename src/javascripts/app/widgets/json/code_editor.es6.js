import * as Adapter from './code_mirror_adapter.es6';
import { forEach, pick } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $rootScope = getModule('$rootScope');
const Command = getModule('command');

/**
 * @ngdoc service
 * @module cf.app
 * @name widgets/json/codeEditor
 * @description
 * Creates a code editor that communicates with the Widget API.
 *
 * Changes to the field value received from the Widget API are synced
 * to the underlying editor element. Conversely, user changes are sent
 * back through the Widget API.
 *
 * @usage[js]
 * const editor = CodeEditor.create(widgetApi)
 *
 * // Add the CodeMirror element to the DOM
 * editor.attach(jqueryElement)
 *
 * // Two 'Command' instances
 * editor.undo
 * editor.redo
 *
 * // Boolean indicating if value is valid json
 * editor.valid
 *
 * // Cleanup
 * editor.destroy()
 */
export function create(widgetApi) {
  const field = widgetApi.field;
  const editor = Adapter.create({ onStateChange: updateState });

  // Internal state for commands. Has 'undoable' and 'redoable'
  // properties.
  // TODO This is only here because Commands can only use a polling
  // interface for their disabled state.
  const state = {};

  const undoCmd = Command.create(editor.undo, {
    disabled: function() {
      return !state.undoable;
    }
  });

  const redoCmd = Command.create(editor.redo, {
    disabled: function() {
      return !state.redoable;
    }
  });

  const offValueChanged = field.onValueChanged(editor.setValue, true);

  const controller = {
    undo: undoCmd,
    redo: redoCmd,
    valid: undefined,
    attach: editor.attach,
    destroy: function() {
      editor.destroy();
      offValueChanged();
    }
  };

  function updateState(editorState) {
    $rootScope.$applyAsync(() => {
      if ('value' in editorState) {
        if (editorState.value) {
          field.setValue(editorState.value);
        } else {
          field.removeValue();
        }
      }

      if ('valid' in editorState) {
        controller.valid = editorState.valid;
      }

      const flags = pick(editorState, ['redoable', 'undoable']);
      forEach(flags, (val, key) => {
        state[key] = val;
      });
    });
  }

  return controller;
}
