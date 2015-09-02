'use strict';

angular.module('contentful').factory('MarkdownEditor', ['$injector', function($injector) {

  var $timeout   = $injector.get('$timeout');
  var wrapEditor = $injector.get('MarkdownEditor/wrapper');
  var LazyLoader = $injector.get('LazyLoader');

  return {
    create:         loadAndCreate,
    createManually: create
  };

  function loadAndCreate(textarea, options) {
    return LazyLoader.get('markdown').then(function (libs) {
      return create(textarea, options, libs.CodeMirror);
    });
  }

  function create(textarea, options, CodeMirror) {
    var editor = wrapEditor(textarea, options, CodeMirror);
    var quoteToggleFn = createPrefixToggleFn('> ');
    var codeToggleFn = createPrefixToggleFn('    ');

    var api = {
      actions: {
        bold:   function () { insertInline('__', 'text in bold');  },
        italic: function () { insertInline('*', 'text in italic'); },
        strike: function () { insertInline('~~', 'striked out');   },
        quote:  function () { modifySelection(quoteToggleFn);      },
        code:   function () { modifySelection(codeToggleFn);       },
        h1:     function () { insertHeader('#');                   },
        h2:     function () { insertHeader('##');                  },
        h3:     function () { insertHeader('###');                 },
        ul:     function () { modifySelection(ulToggleFn);         },
        ol:     function () { modifySelection(olToggleFn);         },
        undo:   function () { editor.cmd('undo');                  },
        redo:   function () { editor.cmd('redo');                  },
        hr:     insertHr,
        indent: indent,
        dedent: dedent,
        table:  insertTable
      },
      history: {
        hasUndo: function () { return editor.getHistorySize('undo') > 0; },
        hasRedo: function () { return editor.getHistorySize('redo') > 0; }
      },
      events: {
        onScroll: function (fn) { editor.attachEvent('scroll', fn, 150); },
        onChange: function (fn) { editor.attachEvent('change', fn);      }
      },
      tie: {
        previewToEditor: tiePreviewToEdiotr,
        editorToEditor:  tieEditorToEditor,
        editorToPreview: tieEditorToPreview
      },
      insert:          editor.insertAtCursor,
      focus:           editor.focus,
      getContent:      editor.getValue,
      destroy:         editor.destroy,
      setContent:      setContent,
      getWrapper:      function () { return editor; }
    };

    addKeyShortcuts({
      'B': api.actions.bold,
      'I': api.actions.italic,
      'Alt-1': api.actions.h1,
      'Alt-2': api.actions.h2,
      'Alt-3': api.actions.h3
    });

    return api;

    function setContent(value) {
      // if value is unchanged, break the loop
      if (editor.getValue() === value) { return; }

      // set value, but save cursor position first
      // position will be restored, but w/o focus (third arg)
      var line = editor.getCurrentLineNumber();
      var ch = editor.getCurrentCharacter();
      editor.setValue(value);
      editor.restoreCursor(ch, line, true);

      // enable undo/redo, by default "undoDepth" is set to 0
      // we set it here so we cannot undo setting initial value (first "setValue" call)
      editor.opt('undoDepth', 200);
    }

    function tiePreviewToEdiotr(el) {
      var info = editor.getScrollInfo();
      var position = info.top / info.height;

      $timeout(function () {
        var top = el.get(0).scrollHeight * position;
        el.scrollTop(top);
      });
    }

    function tieEditorToEditor(other) {
      other = _.isFunction(other.getWrapper) ? other.getWrapper() : other;
      other.restoreCursor(editor.getCurrentCharacter(), editor.getCurrentLineNumber());
    }

    function tieEditorToPreview(el) {
      var position =  el.scrollTop() / el.get(0).scrollHeight;

      $timeout(function () {
        var info = editor.getScrollInfo();
        editor.getEditor().scrollTo(null, position*info.height);
      });
    }

    function addKeyShortcuts(map) {
      var extension = {};
      _.forEach(map, function (value, key) {
        extension['Ctrl-' + key] = value;
        extension['Cmd-'  + key] = value;
      });
      editor.getEditor().addKeyMap(extension);
    }

    /**
     * Simple Markdown markup
     */

    function insertHr() {
      editor.moveIfNotEmpty();
      var nl = editor.getNl();
      var markup = nl + '---' + nl + nl;
      editor.insertAtCursor(markup);
    }

    function indent() {
      editor.insertAtLineBeginning(editor.getIndentation());
    }

    function dedent() {
      var indentation = editor.getIndentation();
      if (editor.lineStartsWith(indentation)) {
        editor.removeFromLineBeginning(indentation.length);
      }
    }

    function insertInline(marker, emptyText) {
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

    function createPrefixToggleFn(prefix) {
      return function() {
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

    function insertHeader(prefix) {
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

    function selectHeader() {
      var result = editor.getCurrentLine().match(/^( {0,3})(#{1,6}) /);
      if (!result) { return null; }
      var indentation = result[1];
      var header = result[2];

      editor.select(getPos(0), getPos(header.length));
      return editor.getSelection();

      function getPos(modifier) {
        return {line: editor.getCurrentLineNumber(), ch: indentation.length + modifier};
      }
    }

    /**
     * List-related functions
     */

    // toggle function for unordered lists
    function ulToggleFn() {
      if (editor.lineStartsWith('- ')) {
        editor.removeFromLineBeginning(2);
      } else {
        var listNumber = getListNumber();
        if (listNumber) { editor.removeFromLineBeginning(listNumber.length); }
        editor.insertAtLineBeginning('- ');
      }
    }

    // toggle function for ordered lists
    function olToggleFn(n) {
      var listNumber = getListNumber();
      if (listNumber) {
        editor.removeFromLineBeginning(listNumber.length);
      } else {
        if (editor.lineStartsWith('- ')) { editor.removeFromLineBeginning(2); }
        editor.insertAtLineBeginning((n || 1) + '. ');
      }
    }

    function getListNumber() {
      var result = editor.getCurrentLine().match(/^(\d+\. )/);
      return result ? result[1] : null;
    }

    /**
     * Table-related functions
     */

    function insertTable(config) {
      var nl = editor.getNl();
      editor.moveIfNotEmpty();
      editor.insertAtCursor(nl);
      var line = editor.getCurrentLineNumber();
      editor.insertAtCursor(generateTableRows(config).join(nl));
      editor.insertAtCursor(nl + nl);
      editor.restoreCursor(2, line);
    }

    function generateTableRows(c) {
      var rows = [];
      var cellWidth = new Array(c.width + 1);
      var cell = ' ' + cellWidth.join(' ') + ' |';
      var separatorCell = ' ' + cellWidth.join('-') + ' |';
      var row = '|';
      var separator = '|';
      var i = 0;

      for (; i < c.cols; i += 1) {
        row += cell;
        separator += separatorCell;
      }
      row = row.replace(/\|  /g, '| ?');

      for (i = 0; i < c.rows; i += 1) { rows.push(row); }
      rows.splice(1, 0, separator);

      return rows;
    }

    /**
     * Selection processing functions
     */

    function modifySelection(toggleFn) {
      editor.usePrimarySelection();

      // there's no selection - just toggle list bullet
      if (!editor.getSelection()) {
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

    function forLineIn(selection, cb) {
      // anchor/head depend on selection direction, so min & max have to be used
      var lines = [selection.anchor.line, selection.head.line];
      var lineRange = _.range(_.min(lines), _.max(lines) + 1);

      _.forEach(lineRange, function (lineNumber, i) {
        cb(lineNumber, i + 1);
      });
    }
  }
}]);
