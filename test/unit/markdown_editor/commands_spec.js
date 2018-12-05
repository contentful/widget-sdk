'use strict';
import _ from 'lodash';

describe('markdown_editor/commands.es6', () => {
  let textarea, editor, commands, cm;

  beforeEach(function() {
    module('contentful/test');
    const Commands = this.$inject('markdown_editor/commands.es6');
    const Wrapper = this.$inject('markdown_editor/codemirror_wrapper.es6');
    const CodeMirror = this.$inject('codemirror');
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const cmFactory = sinon.spy(CodeMirror, 'fromTextArea');
    editor = Wrapper.create(textarea, {}, CodeMirror);
    cm = cmFactory.returnValues[0];
    cmFactory.restore();

    commands = Commands.create(editor);
  });

  afterEach(() => {
    editor.destroy();
    textarea.remove();
    textarea = editor = commands = cm = null;
  });

  describe('inline commands', () => {
    const inlineActions = [
      { action: 'bold', prefix: '__', hint: 'text in bold' },
      { action: 'italic', prefix: '*', hint: 'text in italic' },
      { action: 'strike', prefix: '~~', hint: 'striked out' }
    ];

    inlineActions.forEach(item => {
      it('for ' + item.action + ': inserts sample text and selects content', () => {
        commands[item.action]();
        expect(cm.getValue()).toBe(item.prefix + item.hint + item.prefix);
        const selection = editor.getSelection();
        expect(selection.anchor.ch).toBe(item.prefix.length);
        expect(selection.head.ch).toBe(item.prefix.length + item.hint.length);
      });
    });

    inlineActions.forEach(item => {
      it('for ' + item.action + ': wraps selection', () => {
        const words = ['super', 'hyper', 'extra'];
        editor.setValue(words.join(' '));
        editor.select({ line: 0, ch: 6 }, { line: 0, ch: 11 });
        commands[item.action]();
        const val = editor.getValue();
        expect(val).toBe(words[0] + ' ' + item.prefix + words[1] + item.prefix + ' ' + words[2]);
      });
    });
  });

  describe('indent/dedent', () => {
    it('sums up when repeated', () => {
      commands.indent();
      expect(cm.getValue()).toBe('  ');
      commands.indent();
      expect(cm.getValue()).toBe('    ');
      commands.dedent();
      expect(cm.getValue()).toBe('  ');
    });

    it('works on non-empty line, preserving cursor position', () => {
      cm.setValue('test');
      cm.setCursor({ line: 0, ch: 2 });
      commands.indent();
      expect(cm.getValue()).toBe('  test');
      expect(editor.getCurrentCharacter()).toBe(4);
      commands.dedent();
      expect(cm.getValue()).toBe('test');
      expect(editor.getCurrentCharacter()).toBe(2);
    });
  });

  it('history commands: undo/redo things', () => {
    editor.setValue('test');
    commands.undo();
    // after initial "setContent" call, history tracking starts
    expect(editor.getValue()).toBe('test');
    editor.moveToLineEnd();
    editor.insertAtCursor(' content');
    expect(editor.getValue()).toBe('test content');
    commands.undo();
    expect(editor.getValue()).toBe('test');
    commands.redo();
    expect(editor.getValue()).toBe('test content');
  });

  it('history commands: undo/redo with initial empty string', () => {
    editor.setValue('');
    editor.insertAtCursor('test');
    expect(editor.getValue()).toBe('test');
    commands.undo();
    expect(editor.getValue()).toBe('');
    commands.redo();
    expect(editor.getValue()).toBe('test');
  });

  describe('headers', () => {
    const headers = { h1: '#', h2: '##', h3: '###' };

    _.forEach(headers, (prefix, header) => {
      it('for header ' + header + ': toggles marker, keeps cursor position', () => {
        cm.setValue('test');
        cm.setCursor({ line: 0, ch: 2 });
        commands[header]();
        expect(cm.getValue()).toBe(prefix + ' test');
        expect(editor.getCurrentCharacter()).toBe(prefix.length + 3);
        commands[header]();
        expect(cm.getValue()).toBe('test');
        expect(editor.getCurrentCharacter()).toBe(2);
      });
    });

    it('switches from one type to another', () => {
      cm.setValue('test');
      commands.h1();
      expect(cm.getValue()).toBe('# test');
      commands.h3();
      expect(cm.getValue()).toBe('### test');
      commands.h3();
      expect(cm.getValue()).toBe('test');
    });
  });

  describe('horizontal rule', () => {
    const hrMarkup = '\n---\n\n';

    it('inserts horizontal rule after current line, if not empty', () => {
      cm.setValue('test');
      commands.hr();
      expect(cm.getValue()).toBe('test\n' + hrMarkup);
    });

    it('inserts horizontal rule in current line, if empty', () => {
      cm.setValue('');
      commands.hr();
      expect(cm.getValue()).toBe(hrMarkup);
    });
  });

  describe('code/quote', () => {
    const markers = { code: '    ', quote: '> ' };

    _.forEach(markers, (prefix, marker) => {
      it('for ' + marker + ': toggles marker in current line, saves cursor position', () => {
        cm.setValue('test');
        cm.setCursor({ line: 0, ch: 2 });
        commands[marker]();
        expect(cm.getValue()).toBe(prefix + 'test');
        expect(editor.getCurrentCharacter()).toBe(2 + prefix.length);
        commands[marker]();
        expect(cm.getValue()).toBe('test');
        expect(editor.getCurrentCharacter()).toBe(2);
      });

      it('for ' + marker + ': toggles markers in all lines selected', () => {
        const initialValue = 'one\ntwo\nthree';
        cm.setValue(initialValue);
        cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 5 });
        commands[marker]();
        cm.getValue()
          .split('\n')
          .forEach(line => {
            expect(line.substring(0, prefix.length)).toBe(prefix);
          });
        expect(editor.getCurrentLineNumber()).toBe(2);
        expect(editor.getCurrentCharacter()).toBe(5 + prefix.length);
        cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: Infinity });
        commands[marker]();
        expect(cm.getValue()).toBe(initialValue);
      });
    });
  });

  describe('lists', () => {
    const nl = '\n';
    const initialValue = 'one\ntwo\nthree';
    const lists = { ul: '- ', ol: '1. ' };
    const other = { ul: 'ol', ol: 'ul' };
    const lineCheckers = {
      ul: function(line) {
        expect(line.substring(0, 2)).toBe('- ');
      },
      ol: function(line, i) {
        expect(line.substring(0, 3)).toBe('' + (i + 1) + '. ');
      }
    };

    function selectAll() {
      cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: Infinity });
    }

    _.forEach(lists, (prefix, list) => {
      it('for ' + list + ': inserts marker, surrounds with whitespace', () => {
        commands[list]();
        expect(cm.getValue()).toBe(nl + prefix + nl);
      });

      it('for ' + list + ': creates whitespace and starts list', () => {
        cm.setValue('test');
        cm.setCursor({ line: 0, ch: 2 });
        commands[list]();
        expect(cm.getValue()).toBe('test' + nl + nl + prefix + nl);
        cm.setCursor({ line: 2, ch: 0 });
        commands[list]();
        expect(editor.getCurrentLine()).toBe('');
      });

      it('for ' + list + ': toggles in multiline selection', () => {
        cm.setValue(initialValue);
        selectAll();
        commands[list]();
        cm.getValue()
          .split('\n')
          .forEach(lineCheckers[list]);
        selectAll();
        commands[list]();
        expect(cm.getValue()).toBe(initialValue);
      });

      it('for ' + list + ': changes to other list type', () => {
        const secondType = other[list];
        cm.setValue(initialValue);
        selectAll();
        commands[list]();
        selectAll();
        commands[secondType]();
        cm.getValue()
          .split('\n')
          .forEach(lineCheckers[secondType]);
      });
    });
  });

  it('generates table markup', () => {
    commands.table({ rows: 2, cols: 3 });
    const expected = [
      '| Header     | Header     | Header     |',
      '| ---------- | ---------- | ---------- |',
      '| Cell       | Cell       | Cell       |'
    ].join('\n');
    expect(cm.getValue().indexOf(expected) > -1).toBe(true);
  });

  describe('#link()', () => {
    it('inserts bracketed url at current cursor', () => {
      cm.setValue('AB');
      cm.setCursor({ line: 0, ch: 1 });
      commands.link('https://example.com');
      expect(cm.getValue()).toBe('A<https://example.com>B');
    });

    it('inserts titled url at current cursor', () => {
      cm.setValue('AB');
      cm.setCursor({ line: 0, ch: 1 });
      commands.link('https://example.com', 'title');
      expect(cm.getValue()).toBe('A[title](https://example.com)B');
    });

    it('replace selection with bracketed url', () => {
      cm.setValue('AXXB');
      cm.setSelection({ line: 0, ch: 1 }, { line: 0, ch: 3 });
      commands.link('https://example.com');
      expect(cm.getValue()).toBe('A<https://example.com>B');
    });

    it('replace selection with titled url', () => {
      cm.setValue('AXXB');
      cm.setSelection({ line: 0, ch: 1 }, { line: 0, ch: 3 });
      commands.link('https://example.com', 'title');
      expect(cm.getValue()).toBe('A[title](https://example.com)B');
    });

    it('inserts link with url, text and title at current cursor', () => {
      cm.setValue('AB');
      cm.setCursor({ line: 0, ch: 1 });
      commands.link('https://example.com', 'link text', 'title');
      expect(cm.getValue()).toBe('A[link text](https://example.com "title")B');
    });
  });
});
