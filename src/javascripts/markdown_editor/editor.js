'use strict';

angular.module('contentful').factory('MarkdownEditor', ['$injector', function($injector) {

  var $timeout       = $injector.get('$timeout');
  var $sanitize      = $injector.get('$sanitize');
  var createRenderer = $injector.get('MarkdownEditor/createMarkdownRenderer');
  var createWrapper  = $injector.get('MarkdownEditor/createCodeMirrorWrapper');
  var LazyLoader     = $injector.get('LazyLoader');

  return {
    create:         loadAndCreate,
    createManually: create
  };

  function loadAndCreate(textarea) {
    return LazyLoader.get('markdown').then(function (libs) {
      return create(textarea, libs.CodeMirror, libs.marked);
    });
  }

  function create(textarea, CodeMirror, marked) {
    var NOTIFY_INTERVAL = 250;
    var WORDS_PER_MINUTE = 200;
    var EMBEDLY_CLASS_RE = new RegExp('class="embedly-card"', 'g');

    var notificationTimeout;
    var subscriberCb = null;
    var previousValue = null;

    var e = createWrapper(textarea, CodeMirror);
    var renderMarkdown = createRenderer(marked);
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
        ul:     function () { modifySelection(ulToggleFn);         },
        ol:     function () { modifySelection(olToggleFn);         },
        undo:   function () { e.cmd('undo');                       },
        redo:   function () { e.cmd('redo');                       },
        hr:     insertHr,
        indent: indent,
        dedent: dedent,
        table:  insertTable
      },
      subscribe:       function (cb) { subscriberCb = cb; },
      insert:          function (text) { e.insertAtCursor(text); },
      getWrapper:      function () { return e; },
      setContent:      setContent,
      destroy:         destroy
    };

    function scheduleSubscriberNotification() {
      notificationTimeout = $timeout(notifySubscriber, NOTIFY_INTERVAL);
    }

    function notifySubscriber() {
      if (!subscriberCb) { return; }
      var value = e.getValue();
      // check if something changed
      if (value === previousValue) {
        scheduleSubscriberNotification();
        return;
      }

      previousValue = value;

      var html = renderMarkdown(value);
      html = html.replace(/\r?\n|\r/g, '');
      html = $sanitize(html);
      html = disableEmbedlyControls(html);

      var clean = html.replace(/<\/?[^>]+(>|$)/g, '');
      var words = (clean || '').replace(/\s+/g, ' ').split(' ');
      words = _.filter(words, function (word) { return word.length > 0; });
      var wordCount = words.length || 0;

      var info = {
        chars: value.length || 0,
        words: wordCount,
        time: Math.round(wordCount / WORDS_PER_MINUTE)
      };

      subscriberCb(value, html, info);
      scheduleSubscriberNotification();
    }

    function disableEmbedlyControls(html) {
      return html.replace(EMBEDLY_CLASS_RE, 'class="embedly-card" data-card-controls="0"');
    }

    function setContent(value) {
      if (e.getValue() === value) { return; }
      var line = e.getCurrentLineNumber();
      var ch = e.getCurrentCharacter();
      e.setValue(value);
      e.restoreCursor(ch, line);
      // enable undo/redo, by default "undoDepth" is set to 0
      // we set it here so we cannot undo setting initial value (first "setValue" call)
      e.opt('undoDepth', 200);
    }

    function destroy() {
      subscriberCb = null;
      $timeout.cancel(notificationTimeout);
      e.destroy();
    }

    /**
     * Simple Markdown markup
     */

    function insertHr() {
      e.moveIfNotEmpty();
      var nl = e.getNl();
      var markup = nl + '---' + nl + nl;
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
     * Table-related functions
     */

    function insertTable(config) {
      var nl = e.getNl();
      e.moveIfNotEmpty();
      e.insertAtCursor(nl);
      var line = e.getCurrentLineNumber();
      e.insertAtCursor(generateTableRows(config).join(nl));
      e.insertAtCursor(nl + nl);
      e.restoreCursor(2, line);
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
      var lineRange = _.range(_.min(lines), _.max(lines) + 1);

      _.forEach(lineRange, function (lineNumber, i) {
        cb(lineNumber, i + 1);
      });
    }
  }
}]);
