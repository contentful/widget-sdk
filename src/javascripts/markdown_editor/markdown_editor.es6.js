import $timeout from '$timeout';
import LazyLoader from 'LazyLoader';
import * as Wrapper from 'markdown_editor/codemirror_wrapper';
import * as Commands from 'markdown_editor/commands';
import { isFunction } from 'lodash';

export function create (textarea, options) {
  return LazyLoader.get('markdown').then(function (libs) {
    return createManually(textarea, options, libs.CodeMirror);
  });
}

export function createManually (textarea, options, CodeMirror) {
  const editor = Wrapper.create(textarea, options, CodeMirror);

  const api = {
    actions: Commands.create(editor),
    history: {
      hasUndo: function () { return editor.getHistorySize('undo') > 0; },
      hasRedo: function () { return editor.getHistorySize('redo') > 0; }
    },
    events: {
      onScroll: function (fn) { editor.attachEvent('scroll', fn, 150); },
      onChange: function (fn) { editor.attachEvent('change', wrapChange(fn)); }
    },
    tie: {
      previewToEditor: tiePreviewToEditor,
      editorToEditor: tieEditorToEditor,
      editorToPreview: tieEditorToPreview
    },
    insert: editor.insertAtCursor,
    focus: editor.focus,
    getContent: editor.getValue,
    destroy: editor.destroy,
    setContent: editor.setValue,
    getSelectedText: editor.getSelectedText,
    usePrimarySelection: editor.usePrimarySelection,
    repaint: editor.repaint,
    // TODO Remove this. We want to hide the low-level interface
    getWrapper: function () { return editor; }
  };

  editor.addKeyShortcuts({
    'B': api.actions.bold,
    'I': api.actions.italic,
    'Alt-1': api.actions.h1,
    'Alt-2': api.actions.h2,
    'Alt-3': api.actions.h3
  });

  return api;

  function wrapChange (fn) {
    return function (e, ch) {
      fn(editor.getValue(), e, ch);
    };
  }

  function tiePreviewToEditor (el) {
    const fraction = editor.getScrollFraction();

    $timeout(function () {
      const top = el.get(0).scrollHeight * fraction;
      el.scrollTop(top);
    });
  }

  function tieEditorToEditor (other) {
    other = isFunction(other.getWrapper) ? other.getWrapper() : other;
    other.restoreCursor(editor.getCurrentCharacter(), editor.getCurrentLineNumber());
  }

  /**
   * Scroll the editor so that its scroll position matches that of the
   * given preview element.
   */
  function tieEditorToPreview (previewElement) {
    // We use the scroll fraction because the scroll height of the editor
    // might differ from the scroll height of the preview element.
    const height = previewElement.get(0).scrollHeight;
    const top = previewElement.scrollTop();
    const position = height === 0 ? 0 : top / height;

    $timeout(function () {
      editor.scrollToFraction(position);
    });
  }
}
