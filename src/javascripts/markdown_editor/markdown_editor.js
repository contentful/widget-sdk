'use strict';

angular.module('contentful')
.factory('MarkdownEditor', ['require', function (require) {
  var $timeout = require('$timeout');
  var wrapEditor = require('MarkdownEditor/wrapper');
  var LazyLoader = require('LazyLoader');

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
    var quoteToggleFn = createPrefixToggleFn('> ');
    var codeToggleFn = createPrefixToggleFn('    ');

    var api = {
      actions: {
        bold: function () { insertInline('__', 'text in bold'); },
        italic: function () { insertInline('*', 'text in italic'); },
        strike: function () { insertInline('~~', 'striked out'); },
        quote: function () { modifySelection(quoteToggleFn); },
        code: function () { modifySelection(codeToggleFn); },
        h1: function () { insertHeader('#'); },
        h2: function () { insertHeader('##'); },
        h3: function () { insertHeader('###'); },
        ul: function () { modifySelection(ulToggleFn, true); },
        ol: function () { modifySelection(olToggleFn, true); },
        undo: function () { editor.cmd('undo'); },
        redo: function () { editor.cmd('redo'); },
        hr: insertHr,
        indent: indent,
        dedent: dedent,
        table: insertTable
      },
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
      setContent: setContent,
      repaint: editor.repaint,
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

    function setContent (value) {
      if (editor.getValue() !== value) {
        // set value, but save cursor position first
        // position will be restored, but w/o focus (third arg)
        var line = editor.getCurrentLineNumber();
        var ch = editor.getCurrentCharacter();
        editor.setValue(value);
        editor.restoreCursor(ch, line, true);
      }

      // enable undo/redo, by default "undoDepth" is set to 0 we set it
      // here so we cannot undo setting initial value (first "setValue"
      // call)
      editor.opt('undoDepth', 200);
    }

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

    /**
     * Simple Markdown markup
     */

    function insertHr () {
      editor.moveIfNotEmpty();
      var nl = editor.getNl();
      var markup = nl + '---' + nl + nl;
      editor.insertAtCursor(markup);
    }

    function indent () {
      editor.insertAtLineBeginning(editor.getIndentation());
    }

    function dedent () {
      var indentation = editor.getIndentation();
      if (editor.lineStartsWith(indentation)) {
        editor.removeFromLineBeginning(indentation.length);
      }
    }

    function insertInline (marker, emptyText) {
      editor.usePrimarySelection();

      // there's a selection - wrap it with inline marker
      if (editor.getSelection()) {
        editor.wrapSelection(marker);
        return;
      }

      // no selection - insert sample text and select it
      editor.insertAtCursor(marker + emptyText + marker);
      editor.selectBackwards(marker.length, emptyText.length);
    }

    function createPrefixToggleFn (prefix) {
      return function () {
        if (editor.lineStartsWith(prefix)) {
          editor.removeFromLineBeginning(prefix.length);
        } else {
          editor.insertAtLineBeginning(prefix);
        }
      };
    }

    /**
     * Header-related functions
     */

    function insertHeader (prefix) {
      var initialCh = editor.getCurrentCharacter();
      var currentHeader = selectHeader();

      // there's no header at the current line - create one
      if (!currentHeader) {
        editor.moveToLineBeginning();
        editor.insertAtCursor(prefix + ' ');
        editor.restoreCursor(initialCh + prefix.length + 1);
        return;
      }

      // there's exactly the same header - remove one
      if (editor.getSelectedText() === prefix) {
        editor.extendSelectionBy(1);
        var removedCh = editor.getSelectionLength();
        editor.removeSelectedText();
        editor.restoreCursor(initialCh - removedCh);
        return;
      }

      // there's another header at the current line - replace
      var diff = prefix.length - editor.getSelectionLength();
      editor.replaceSelectedText(prefix);
      editor.restoreCursor(initialCh + diff);
    }

    function selectHeader () {
      var result = editor.getCurrentLine().match(/^( {0,3})(#{1,6}) /);
      if (!result) { return null; }
      var indentation = result[1];
      var header = result[2];

      editor.select(getPos(0), getPos(header.length));
      return editor.getSelection();

      function getPos (modifier) {
        return {line: editor.getCurrentLineNumber(), ch: indentation.length + modifier};
      }
    }

    /**
     * List-related functions
     */

    // toggle function for unordered lists
    function ulToggleFn () {
      if (editor.lineStartsWith('- ')) {
        editor.removeFromLineBeginning(2);
      } else {
        var listNumber = getListNumber();
        if (listNumber) { editor.removeFromLineBeginning(listNumber.length); }
        editor.insertAtLineBeginning('- ');
      }
    }

    // toggle function for ordered lists
    function olToggleFn (n) {
      var listNumber = getListNumber();
      if (listNumber) {
        editor.removeFromLineBeginning(listNumber.length);
      } else {
        if (editor.lineStartsWith('- ')) { editor.removeFromLineBeginning(2); }
        editor.insertAtLineBeginning((n || 1) + '. ');
      }
    }

    function getListNumber () {
      var result = editor.getCurrentLine().match(/^(\d+\. )/);
      return result ? result[1] : null;
    }

    /**
     * Table-related functions
     */

    function insertTable (config) {
      var nl = editor.getNl();
      editor.moveIfNotEmpty();
      editor.insertAtCursor(nl);
      var line = editor.getCurrentLineNumber();
      editor.insertAtCursor(generateTableRows(config).join(nl));
      editor.insertAtCursor(nl + nl);
      editor.restoreCursor(2, line);
    }

    function generateTableRows (c) {
      var cellWidth = new Array(11);
      var cell = ' ' + cellWidth.join(' ') + ' |';
      var separatorCell = ' ' + cellWidth.join('-') + ' |';
      var baseRow = '|';
      var separatorRow = '|';
      var i = 0;

      for (; i < c.cols; i += 1) {
        baseRow += cell;
        separatorRow += separatorCell;
      }

      var bodyRow = baseRow.replace(/\| {5}/g, '| Cell');
      var headerRow = baseRow.replace(/\| {7}/g, '| Header');

      var rows = [headerRow, separatorRow];
      for (i = 0; i < c.rows - 1; i += 1) {
        rows.push(bodyRow);
      }

      return rows;
    }

    /**
     * Selection processing functions
     */

    function modifySelection (toggleFn, isList) {
      editor.usePrimarySelection();

      // there's no selection - just toggle line prefix
      if (!editor.getSelection()) {
        // but if adding list, add whitespace before and after list
        if (isList && !getListNumber() && !editor.lineStartsWith('- ')) {
          prepareListWhitespace();
        }
        toggleFn();
        return;
      }

      // there's a selection - toggle list bullet for each line
      // listNumber is 1, 2, 3... and can be used as ol bullet
      forLineIn(editor.getSelection(), function (lineNumber, listNumber) {
        editor.moveToLineBeginning(lineNumber);
        toggleFn(listNumber);
      });
      editor.moveToLineEnd();
    }

    function prepareListWhitespace () {
      var line = editor.getCurrentLineNumber();
      var isEmpty = editor.isLineEmpty();
      var emptyLines = countEmptyLines();
      var linesToInsert = (isEmpty ? 2 : 3) - emptyLines;

      editor.moveToLineEnd();
      editor.insertAtCursor(editor.getNl(linesToInsert));
      editor.restoreCursor(0, isEmpty ? line : line + 1);
      editor.restoreCursor(0, editor.getCurrentLineNumber() + 1);
    }

    function countEmptyLines () {
      var line = editor.getCurrentLineNumber() + 1;
      var empty = 0;

      while (editor.isLineEmpty(line)) {
        empty += 1; line += 1;
      }

      return empty;
    }

    function forLineIn (selection, cb) {
      // anchor/head depend on selection direction, so min & max have to be used
      var lines = [selection.anchor.line, selection.head.line];
      var lineRange = _.range(_.min(lines), _.max(lines) + 1);

      _.forEach(lineRange, function (lineNumber, i) {
        cb(lineNumber, i + 1);
      });
    }
  }
}]);
