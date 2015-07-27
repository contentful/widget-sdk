'use strict';

angular.module('contentful').factory('MarkdownEditor', ['$injector', function($injector) {

  var renderMarkdown = $injector.get('MarkdownEditor/customRenderer');
  var createWrapper  = $injector.get('MarkdownEditor/createCodeMirrorWrapper');

  return { create: create };

  function create(textarea) {
    var NOTIFY_INTERVAL = 250;
    var WORDS_PER_MINUTE = 200;
    var DESTROYED = false;
    var NOTIFY, SUBSCRIBER_CB;

    var previousValue = '';
    var e = createWrapper(textarea);
    var quoteToggleFn = createPrefixToggleFn('> ');
    var codeToggleFn = createPrefixToggleFn('    ');

    scheduleSubscriberNotification();

    return {
      actions: {
        bold:   function () { insertInline('__', 'text in bold');  },
        italic: function () { insertInline('*', 'text in italic'); },
        strike: function () { insertInline('~~', 'striked out');   },
        quote:  function () { modifySelection(quoteToggleFn);      },
        code:   function () { modifySelection(codeToggleFn);       },
        h1:     function () { insertHeader('#');                   },
        h2:     function () { insertHeader('##');                  },
        h3:     function () { insertHeader('###');                 },
        hr:     function () { insertHr();                          },
        indent: function () { indent();                            },
        dedent: function () { dedent();                            },
        ul:     function () { modifySelection(ulToggleFn);         },
        ol:     function () { modifySelection(olToggleFn);         },
        undo:   function () { e.cmd('undo');                       },
        redo:   function () { e.cmd('redo');                       }
      },
      subscribe:       function (cb) { SUBSCRIBER_CB = cb; },
      insert:          function (text) { e.insertAtCursor(text); },
      alterValue:      alterValue,
      destroy:         destroy
    };

    function scheduleSubscriberNotification() {
      NOTIFY = window.setTimeout(notifySubscriber, NOTIFY_INTERVAL);
    }

    function notifySubscriber() {
      var value = e.getValue();
      // check if something changed
      if (value === previousValue) {
        scheduleSubscriberNotification();
        return;
      }

      previousValue = value;
      var html = renderMarkdown(value);
      var clean = html.replace(/<\/?[^>]+(>|$)/g, '');
      var words = (clean || '').replace(/\s+/g, ' ').split(' ').length - 1;

      var info = {
        chars: value.length || 0,
        words: words < 0 ? 0 : words,
        time: Math.round(words / WORDS_PER_MINUTE)
      };

      if (DESTROYED) { return; }

      if (SUBSCRIBER_CB) {
        SUBSCRIBER_CB(value, html, info);
      }

      scheduleSubscriberNotification();
    }

    function alterValue(value) {
      if (e.getValue() === value) { return; }
      var line = e.getCurrentLineNumber();
      var ch = e.getCurrentCharacter();
      e.setValue(value);
      e.restoreCursor(ch, line);
      // enable undo/redo
      e.opt('undoDepth', 200);
    }

    function destroy() {
      DESTROYED = true;
      window.clearTimeout(NOTIFY);
    }

    /**
     * Simple Markdown markup
     */

    function insertHr() {
      // if the current line is not empty, then move to next one
      if (e.getCurrentLineLength() > 0) {
        e.moveToLineBeginning(e.getCurrentLineNumber() + 1);
      }

      var nl = e.getNl();
      var markup = nl + '- - -' + nl + nl;
      e.insertAtCursor(markup);
    }

    function indent() {
      e.insertAtLineBeginning(e.getIndentation());
    }

    function dedent() {
      var indentation = e.getIndentation();
      if (e.lineStartsWith(indentation)) {
        e.removeFromLineBeginning(indentation.length);
      }
    }

    function insertInline(marker, emptyText) {
      e.usePrimarySelection();

      // there's a selection - wrap it with inline marker
      if (e.getSelection()) {
        e.wrapSelection(marker);
        return;
      }

      // no selection - insert sample text and select it
      e.insertAtCursor(marker + emptyText + marker);
      e.selectBackwards(marker.length, emptyText.length);
    }

    function createPrefixToggleFn(prefix) {
      return function() {
        if (e.lineStartsWith(prefix)) {
          e.removeFromLineBeginning(prefix.length);
        } else {
          e.insertAtLineBeginning(prefix);
        }
      };
    }

    /**
     * Header-related functions
     */

    function insertHeader(prefix) {
      var initialCh = e.getCurrentCharacter();
      var currentHeader = selectHeader();

      // there's no header at the current line - create one
      if (!currentHeader) {
        e.moveToLineBeginning();
        e.insertAtCursor(prefix + ' ');
        e.restoreCursor(initialCh + prefix.length + 1);
        return;
      }

      // there's exactly the same header - remove one
      if (e.getSelectedText() === prefix) {
        e.extendSelectionBy(1);
        var removedCh = e.getSelectionLength();
        e.removeSelectedText();
        e.restoreCursor(initialCh - removedCh);
        return;
      }

      // there's another header at the current line - replace
      var diff = prefix.length - e.getSelectionLength();
      e.replaceSelectedText(prefix);
      e.restoreCursor(initialCh + diff);
    }

    function selectHeader() {
      var result = e.getCurrentLine().match(/^( {0,3})(#{1,6}) /);
      if (!result) { return null; }
      var indentation = result[1];
      var header = result[2];

      e.select(getPos(0), getPos(header.length));
      return e.getSelection();

      function getPos(modifier) {
        return {line: e.getCurrentLineNumber(), ch: indentation.length + modifier};
      }
    }

    /**
     * List-related functions
     */

    // toggle function for unordered lists
    function ulToggleFn() {
      if (e.lineStartsWith('- ')) {
        e.removeFromLineBeginning(2);
      } else {
        var listNumber = getListNumber();
        if (listNumber) { e.removeFromLineBeginning(listNumber.length); }
        e.insertAtLineBeginning('- ');
      }
    }

    // toggle function for ordered lists
    function olToggleFn(n) {
      var listNumber = getListNumber();
      if (listNumber) {
        e.removeFromLineBeginning(listNumber.length);
      } else {
        if (e.lineStartsWith('- ')) { e.removeFromLineBeginning(2); }
        e.insertAtLineBeginning((n || 1) + '. ');
      }
    }

    function getListNumber() {
      var result = e.getCurrentLine().match(/^(\d+\. )/);
      return result ? result[1] : null;
    }

    /**
     * Selection processing functions
     */

    function modifySelection(toggleFn) {
      e.usePrimarySelection();

      // there's no selection - just toggle list bullet
      if (!e.getSelection()) {
        toggleFn();
        return;
      }

      // there's a selection - toggle list bullet for each line
      // listNumber is 1, 2, 3... and can be used as ol bullet
      forLineIn(e.getSelection(), function (lineNumber, listNumber) {
        e.moveToLineBeginning(lineNumber);
        toggleFn(listNumber);
      });
      e.moveToLineEnd();
    }

    function forLineIn(selection, cb) {
      // anchor/head depend on selection direction, so min & max have to be used
      var lines = [selection.anchor.line, selection.head.line];
      var i = get('min');
      var max = get('max');
      var n = 1;

      while (i <= max) {
        cb(i, n);
        i += 1;
        n += 1;
      }

      function get(method) { return Math[method].apply(Math, lines); }
    }
  }
}]);
