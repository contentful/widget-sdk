'use strict';

angular.module('contentful').factory('MarkdownEditor/createCodeMirrorWrapper', function () {
  return function(textarea) {
    /*global CodeMirror*/
    var cm = CodeMirror.fromTextArea(textarea, {
      mode: 'gfm',
      lineNumbers: false,
      undoDepth: 0,
      matchBrackets: true,
      lineWrapping: true,
      theme: 'elegant',
      lineSeparator: '\n',
      tabSize: 2,
      indentWithTabs: false,
      indentUnit: 2
    });

    cm.setOption('extraKeys', {
      Tab: function () { replaceSelectedText(getIndentation()); },
      Enter: 'newlineAndIndentContinueMarkdownList'
    });

    cm.setSize(null, '400px');

    // API
    return {
      getEditor:               function () { return cm; },
      destroy:                 function () { cm.toTextArea(); },
      setValue:                setValue,
      cmd:                     cmd,
      opt:                     opt,
      moveToLineBeginning:     moveToLineBeginning,
      moveIfNotEmpty:          moveIfNotEmpty,
      restoreCursor:           restoreCursor,
      moveToLineEnd:           moveToLineEnd,
      usePrimarySelection:     usePrimarySelection,
      select:                  select,
      selectBackwards:         selectBackwards,
      extendSelectionBy:       extendSelectionBy,
      insertAtCursor:          insertAtCursor,
      insertAtLineBeginning:   insertAtLineBeginning,
      wrapSelection:           wrapSelection,
      removeFromLineBeginning: removeFromLineBeginning,
      removeSelectedText:      removeSelectedText,
      replaceSelectedText:     replaceSelectedText,
      getSelection:            getSelection,
      getLine:                 getLine,
      getSelectedText:         getSelectedText,
      getSelectionLength:      getSelectionLength,
      getCurrentLine:          getCurrentLine,
      getCurrentLineNumber:    getCurrentLineNumber,
      getCurrentCharacter:     getCurrentCharacter,
      getCurrentLineLength:    getCurrentLineLength,
      lineStartsWith:          lineStartsWith,
      getIndentation:          getIndentation,
      getNl:                   getNl,
      getValue:                getValue
    };

    /**
     * low-level editor manipulation functions
     */

    function setValue(value) {
      cm.setValue(value || '');
    }

    function cmd(name) {
      cm.execCommand(name);
      cm.focus();
    }

    function moveToLineBeginning(lineNumber) {
      cm.setCursor({line: lineNumber || getCurrentLineNumber(), ch: 0});
      cm.focus();
    }

    function moveIfNotEmpty() {
      if (getCurrentLineLength() < 1) { return; }

      var next = getCurrentLineNumber() + 1;
      if (cm.lastLine() < next) {
        moveToLineEnd();
        insertAtCursor(getNl());
      }

      moveToLineBeginning(next);
    }

    function restoreCursor(character, lineNumber) {
      cm.setCursor({line: lineNumber || getCurrentLineNumber(), ch: character});
      cm.focus();
    }

    function moveToLineEnd(lineNumber) {
      cm.setCursor({line: lineNumber || getCurrentLineNumber(), ch: getCurrentLineLength() });
      cm.focus();
    }

    function usePrimarySelection() {
      cmd('singleSelection');
    }

    function select(from, to) {
      cm.setSelection(from, to);
      cm.focus();
    }

    function selectBackwards(skip, len) {
      select(getPos(-skip - len), getPos(-skip));

      function getPos(modifier) {
        return {
          line: getCurrentLineNumber(),
          ch: getCurrentCharacter() + modifier
        };
      }
    }

    function extendSelectionBy(modifier) {
      select(getPos('anchor', 0), getPos('head', modifier));

      function getPos(prop, modifier) {
        var selection = getSelection();
        return {line: selection[prop].line, ch: selection[prop].ch + modifier};
      }
    }

    function insertAtCursor(text) {
      cm.replaceRange(text, cm.getCursor());
      cm.focus();
    }

    function insertAtLineBeginning(text) {
      var initialCh = getCurrentCharacter();
      moveToLineBeginning();
      insertAtCursor(text);
      restoreCursor(initialCh + text.length);
      cm.focus();
    }

    function wrapSelection(wrapper) {
      var replacement = wrapper + getSelectedText() + wrapper;
      var selection = getSelection();
      cm.replaceRange(replacement, selection.anchor, selection.head);
      cm.focus();
    }

    function removeFromLineBeginning(charCount) {
      var lineNumber = getCurrentLineNumber();
      cm.replaceRange('', {line: lineNumber, ch: 0}, {line: lineNumber, ch: charCount});
      cm.focus();
    }

    function removeSelectedText() {
      cm.replaceSelection('');
      cm.focus();
    }

    function replaceSelectedText(replacement) {
      cm.replaceSelection(replacement);
      cm.focus();
    }

    /**
     *  low-level editor get/check functions
     */

    function getSelection() {
      var selections = cm.listSelections();
      if (!cm.somethingSelected() || !selections || selections.length < 1) {
        return null;
      }
      return selections[0];
    }

    function getLine(n) {
      return cm.getLine(n) || '';
    }

    function getSelectedText() {
      return getSelection() ? cm.getSelection() : '';
    }

    function getSelectionLength() {
      return getSelectedText().length;
    }

    function getCurrentLine() {
      return getLine(getCurrentLineNumber());
    }

    function getCurrentLineNumber() {
      return cm.getCursor().line;
    }

    function getCurrentCharacter() {
      return cm.getCursor().ch;
    }

    function getCurrentLineLength() {
      return getCurrentLine().length;
    }

    function lineStartsWith(text) {
      return getCurrentLine().substring(0, text.length) === text;
    }

    function getIndentation() {
      return repeat(' ', opt('indentUnit'));
    }

    function getNl() {
      return opt('lineSeparator');
    }

    function getValue() {
      return cm.getValue() || '';
    }

    function repeat(what, n) {
      return new Array(n + 1).join(what);
    }

    function opt(name, value) {
      if (!value) { return cm.getOption(name); }
      cm.setOption(name, value);
    }
  };
});
