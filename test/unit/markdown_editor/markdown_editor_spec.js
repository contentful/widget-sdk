'use strict';

describe('Markdown editor', function () {
  let textarea, editor, actions, wrapper, cm;
  const libs = window.cfLibs.markdown;

  beforeEach(function () {
    module('contentful/test');
    const MarkdownEditor = this.$inject('MarkdownEditor');
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    editor = MarkdownEditor.createManually(textarea, {}, libs.CodeMirror, libs.marked);
    actions = editor.actions;
    wrapper = editor.getWrapper();
    cm = wrapper.getEditor();
  });

  afterEach(function () {
    textarea = editor = actions = wrapper = cm = null;
  });

  describe('Actions', function () {
    describe('inline actions', function () {
      const inlineActions = [
        { action: 'bold', prefix: '__', hint: 'text in bold' },
        { action: 'italic', prefix: '*', hint: 'text in italic' },
        { action: 'strike', prefix: '~~', hint: 'striked out' }
      ];

      inlineActions.forEach(function (item) {
        it('for ' + item.action + ': inserts sample text and selects content', function () {
          actions[item.action]();
          expect(cm.getValue()).toBe(item.prefix + item.hint + item.prefix);
          const selection = wrapper.getSelection();
          expect(selection.anchor.ch).toBe(item.prefix.length);
          expect(selection.head.ch).toBe(item.prefix.length + item.hint.length);
        });
      });

      inlineActions.forEach(function (item) {
        it('for ' + item.action + ': wraps selection', function () {
          const words = ['super', 'hyper', 'extra'];
          wrapper.setValue(words.join(' '));
          wrapper.select({ line: 0, ch: 6 }, { line: 0, ch: 11 });
          actions[item.action]();
          const val = wrapper.getValue();
          expect(val).toBe(words[0] + ' ' + item.prefix + words[1] + item.prefix + ' ' + words[2]);
        });
      });
    });

    describe('indent/dedent', function () {
      it('sums up when repeated', function () {
        actions.indent();
        expect(cm.getValue()).toBe('  ');
        actions.indent();
        expect(cm.getValue()).toBe('    ');
        actions.dedent();
        expect(cm.getValue()).toBe('  ');
      });

      it('works on non-empty line, preserving cursor position', function () {
        cm.setValue('test');
        cm.setCursor({ line: 0, ch: 2 });
        actions.indent();
        expect(cm.getValue()).toBe('  test');
        expect(wrapper.getCurrentCharacter()).toBe(4);
        actions.dedent();
        expect(cm.getValue()).toBe('test');
        expect(wrapper.getCurrentCharacter()).toBe(2);
      });
    });

    it('history actions: undo/redo things', function () {
      editor.setContent('test');
      actions.undo();
      // after initial "setContent" call, history tracking starts
      expect(wrapper.getValue()).toBe('test');
      wrapper.moveToLineEnd();
      wrapper.insertAtCursor(' content');
      expect(wrapper.getValue()).toBe('test content');
      actions.undo();
      expect(wrapper.getValue()).toBe('test');
      actions.redo();
      expect(wrapper.getValue()).toBe('test content');
    });

    it('history actions: undo/redo with initial empty string', function () {
      editor.setContent('');
      wrapper.insertAtCursor('test');
      expect(wrapper.getValue()).toBe('test');
      actions.undo();
      expect(wrapper.getValue()).toBe('');
      actions.redo();
      expect(wrapper.getValue()).toBe('test');
    });

    describe('headers', function () {
      const headers = { h1: '#', h2: '##', h3: '###' };

      _.forEach(headers, function (prefix, header) {
        it('for header ' + header + ': toggles marker, keeps cursor position', function () {
          cm.setValue('test');
          cm.setCursor({ line: 0, ch: 2 });
          actions[header]();
          expect(cm.getValue()).toBe(prefix + ' test');
          expect(wrapper.getCurrentCharacter()).toBe(prefix.length + 3);
          actions[header]();
          expect(cm.getValue()).toBe('test');
          expect(wrapper.getCurrentCharacter()).toBe(2);
        });
      });

      it('switches from one type to another', function () {
        cm.setValue('test');
        actions.h1();
        expect(cm.getValue()).toBe('# test');
        actions.h3();
        expect(cm.getValue()).toBe('### test');
        actions.h3();
        expect(cm.getValue()).toBe('test');
      });
    });

    describe('horizontal rule', function () {
      const hrMarkup = '\n---\n\n';

      it('inserts horizontal rule after current line, if not empty', function () {
        cm.setValue('test');
        actions.hr();
        expect(cm.getValue()).toBe('test\n' + hrMarkup);
      });

      it('inserts horizontal rule in current line, if empty', function () {
        cm.setValue('');
        actions.hr();
        expect(cm.getValue()).toBe(hrMarkup);
      });
    });

    describe('code/quote', function () {
      const markers = { code: '    ', quote: '> ' };

      _.forEach(markers, function (prefix, marker) {
        it('for ' + marker + ': toggles marker in current line, saves cursor position', function () {
          cm.setValue('test');
          cm.setCursor({ line: 0, ch: 2 });
          actions[marker]();
          expect(cm.getValue()).toBe(prefix + 'test');
          expect(wrapper.getCurrentCharacter()).toBe(2 + prefix.length);
          actions[marker]();
          expect(cm.getValue()).toBe('test');
          expect(wrapper.getCurrentCharacter()).toBe(2);
        });

        it('for ' + marker + ': toggles markers in all lines selected', function () {
          const initialValue = 'one\ntwo\nthree';
          cm.setValue(initialValue);
          cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 5 });
          actions[marker]();
          cm.getValue().split('\n').forEach(function (line) {
            expect(line.substring(0, prefix.length)).toBe(prefix);
          });
          expect(wrapper.getCurrentLineNumber()).toBe(2);
          expect(wrapper.getCurrentCharacter()).toBe(5 + prefix.length);
          cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: Infinity });
          actions[marker]();
          expect(cm.getValue()).toBe(initialValue);
        });
      });
    });

    describe('lists', function () {
      const nl = '\n';
      const initialValue = 'one\ntwo\nthree';
      const lists = { ul: '- ', ol: '1. ' };
      const other = { ul: 'ol', ol: 'ul' };
      const lineCheckers = {
        ul: function (line) { expect(line.substring(0, 2)).toBe('- '); },
        ol: function (line, i) { expect(line.substring(0, 3)).toBe('' + (i + 1) + '. '); }
      };

      function selectAll () { cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: Infinity }); }

      _.forEach(lists, function (prefix, list) {
        it('for ' + list + ': inserts marker, surrounds with whitespace', function () {
          actions[list]();
          expect(cm.getValue()).toBe(nl + prefix + nl);
        });

        it('for ' + list + ': creates whitespace and starts list', function () {
          cm.setValue('test');
          cm.setCursor({ line: 0, ch: 2 });
          actions[list]();
          expect(cm.getValue()).toBe('test' + nl + nl + prefix + nl);
          cm.setCursor({ line: 2, ch: 0 });
          actions[list]();
          expect(wrapper.getCurrentLine()).toBe('');
        });

        it('for ' + list + ': toggles in multiline selection', function () {
          cm.setValue(initialValue);
          selectAll();
          actions[list]();
          cm.getValue().split('\n').forEach(lineCheckers[list]);
          selectAll();
          actions[list]();
          expect(cm.getValue()).toBe(initialValue);
        });

        it('for ' + list + ': changes to other list type', function () {
          const secondType = other[list];
          cm.setValue(initialValue);
          selectAll();
          actions[list]();
          selectAll();
          actions[secondType]();
          cm.getValue().split('\n').forEach(lineCheckers[secondType]);
        });
      });
    });

    it('generates table markup', function () {
      actions.table({ rows: 2, cols: 3 });
      const expected = [
        '| Header     | Header     | Header     |',
        '| ---------- | ---------- | ---------- |',
        '| Cell       | Cell       | Cell       |'
      ].join('\n');
      expect(cm.getValue().indexOf(expected) > -1).toBe(true);
    });
  });

});
