'use strict';

angular.module('contentful')
.factory('MarkdownEditor', ['require', function (require) {
  var $timeout = require('$timeout');
  var wrapEditor = require('MarkdownEditor/wrapper');
  var LazyLoader = require('LazyLoader');
  var Commands = require('markdown_editor/commands');

  return {
    create: loadAndCreate,
    createManually: create
  };

  function loadAndCreate (textarea, options) {
    return LazyLoader.get('markdown').then(function (libs) {
      return create(textarea, options, libs.CodeMirror);
    });
  }

  function create (textarea, options, CodeMirror) {
    var editor = wrapEditor(textarea, options, CodeMirror);

    var api = {
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
      var fraction = editor.getScrollFraction();

      $timeout(function () {
        var top = el.get(0).scrollHeight * fraction;
        el.scrollTop(top);
      });
    }

    function tieEditorToEditor (other) {
      other = _.isFunction(other.getWrapper) ? other.getWrapper() : other;
      other.restoreCursor(editor.getCurrentCharacter(), editor.getCurrentLineNumber());
    }

    function tieEditorToPreview (el) {
      var position = el.scrollTop() / el.get(0).scrollHeight;

      $timeout(function () {
        editor.scrollToFraction(position);
      });
    }
  }
}]);
