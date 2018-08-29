'use strict';

describe('CodeMirror wrapper', () => {
  let textarea, wrapper, cm, focusSpy, CodeMirror;

  function assertHasFocused() {
    sinon.assert.called(focusSpy);
  }
  function assertHasNotFocused() {
    sinon.assert.notCalled(focusSpy);
  }

  beforeEach(function() {
    module('contentful/test');
    const Wrapper = this.$inject('markdown_editor/codemirror_wrapper');
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    CodeMirror = this.$inject('codemirror');

    const cmFactory = sinon.spy(CodeMirror, 'fromTextArea');
    wrapper = Wrapper.create(textarea, {}, CodeMirror);
    cm = cmFactory.returnValues[0];
    cmFactory.restore();

    focusSpy = sinon.spy();
    cm.on('focus', focusSpy);
  });

  afterEach(() => {
    wrapper.destroy();
    $(textarea).remove();
    textarea = wrapper = cm = focusSpy = CodeMirror = null;
  });

  describe('Wrapper creation', () => {
    it('wraps CodeMirror instance', () => {
      expect(cm instanceof CodeMirror).toBe(true);
      expect(cm.getTextArea()).toBe(textarea);
    });

    it('sets options on CodeMirror instance', () => {
      const opt = cm.getOption.bind(cm);
      expect(opt('mode')).toBe('markdown');
      expect(opt('lineNumbers')).toBe(false);
      expect(opt('undoDepth')).toBe(200);
      expect(opt('lineSeparator')).toBe(null);
      expect(opt('indentUnit')).toBe(2);
    });

    it('restores to original textarea on destroy', () => {
      expect(textarea.style.display).toBe('none');
      wrapper.destroy();
      expect(textarea.style.display).toBe('');
    });
  });

  describe('Getter methods', () => {
    it('simple getter methods', () => {
      expect(wrapper.getNl()).toBe('\n');
      expect(wrapper.getIndentation()).toBe('  ');
      assertHasNotFocused();
    });

    it('value getter', () => {
      cm.setValue('test');
      expect(wrapper.getValue()).toBe('test');
      assertHasNotFocused();
    });

    it('line value getter', () => {
      cm.setValue('line 1\nline 2\nline 3, last');
      expect(wrapper.getLine(0)).toBe('line 1');
      expect(wrapper.getLine(1)).toBe('line 2');
      cm.setCursor({ line: 2, ch: 0 });
      expect(wrapper.getCurrentLine()).toBe('line 3, last');
      expect(wrapper.getCurrentLineLength()).toBe(12);
      assertHasNotFocused();
    });

    it('position getters', () => {
      cm.setValue('test\ntest');
      cm.setCursor({ line: 1, ch: 1 });
      expect(wrapper.getCurrentLineNumber()).toBe(1);
      expect(wrapper.getCurrentCharacter()).toBe(1);
      assertHasNotFocused();
    });

    it('starting substring test', () => {
      cm.setValue('testing');
      expect(wrapper.lineStartsWith('test')).toBe(true);
      expect(wrapper.lineStartsWith('xtest')).toBe(false);
      assertHasNotFocused();
    });
  });

  describe('Insertion/replacement/removal methods', () => {
    it('alters value of editor', () => {
      wrapper.setValue('test');
      expect(wrapper.getValue()).toBe('test');
      assertHasNotFocused();
    });

    it('inserts on cursor position', () => {
      cm.setValue('test\nacdef');
      cm.setCursor({ line: 1, ch: 1 });
      wrapper.insertAtCursor('b');
      expect(wrapper.getValue()).toBe('test\nabcdef');
      assertHasFocused();
    });

    it('inserts at the beginning of the line', () => {
      cm.setValue('test\nbcdef');
      cm.setCursor({ line: 1, ch: 3 });
      wrapper.insertAtLineBeginning('a');
      expect(wrapper.getValue()).toBe('test\nabcdef');
      assertHasFocused();
    });

    it('removes from line beginning', () => {
      const val = 'to-be-removed test';
      cm.setValue(val);
      wrapper.removeFromLineBeginning(val.split(' ')[0].length + 1);
      expect(wrapper.getValue()).toBe('test');
      assertHasFocused();
    });

    it('removes selected text', () => {
      cm.setValue('this is not fun');
      cm.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 12 });
      wrapper.removeSelectedText();
      expect(wrapper.getValue()).toBe('this is fun');
      assertHasFocused();
    });

    it('replaces selected text', () => {
      cm.setValue('this is not fun');
      cm.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 11 });
      wrapper.replaceSelectedText('really');
      expect(wrapper.getValue()).toBe('this is really fun');
      assertHasFocused();
    });

    it('does not allow you to undo initial value population', () => {
      wrapper.setValue('AAA');
      wrapper.cmd('undo');
      expect(wrapper.getValue()).toBe('AAA');

      wrapper.setValue('BBB');
      expect(wrapper.getValue()).toBe('BBB');
      wrapper.cmd('undo');
      expect(wrapper.getValue()).toBe('AAA');
    });
  });

  describe('Cursor movement methods', () => {
    const val = 'Some longer line.\nThe next one.';

    beforeEach(() => {
      cm.setValue(val);
    });

    it('line jumping, end/beginning', () => {
      cm.setCursor({ line: 0, ch: 3 });
      wrapper.moveToLineBeginning();
      expect(wrapper.getCurrentCharacter()).toBe(0);
      wrapper.moveToLineEnd();
      expect(wrapper.getCurrentCharacter()).toBe(val.split('\n')[0].length);
      assertHasFocused();
    });

    describe('cursor movement', () => {
      it('moves cursor around, within current line', () => {
        wrapper.restoreCursor(2);
        expect(wrapper.getCurrentLineNumber()).toBe(0);
        expect(wrapper.getCurrentCharacter()).toBe(2);
        assertHasFocused();
      });

      it('moves cursor to another line when supplied with one', () => {
        wrapper.restoreCursor(5, 1);
        expect(wrapper.getCurrentLineNumber()).toBe(1);
        expect(wrapper.getCurrentCharacter()).toBe(5);
        assertHasFocused();
      });
    });

    describe('jumping to next line', () => {
      it('moves to next line if current line is not empty', () => {
        cm.setCursor({ line: 0, ch: 2 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(1);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        assertHasFocused();
      });

      it('stays as is if line is empty', () => {
        cm.setValue(val + '\n\ntest');
        cm.setCursor({ line: 2, ch: 0 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(2);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        assertHasNotFocused();
      });

      it('expands current value if in last line', () => {
        cm.setCursor({ line: 1, ch: 3 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(2);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        expect(wrapper.getCurrentLineLength()).toBe(0);
        assertHasFocused();
      });
    });
  });

  describe('Selection methods', () => {
    const val = 'Some text that will be selected in the future.';

    beforeEach(() => {
      cm.setValue(val);
      cm.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 9 });
    });

    it('selected text getters', () => {
      expect(wrapper.getSelectedText()).toBe('text');
      expect(wrapper.getSelectionLength()).toBe(4);
      assertHasNotFocused();
    });

    describe('selection getter', () => {
      it('returns null when no selection is there', () => {
        cm.setCursor({ line: 0, ch: 0 }); // clear selection this way
        expect(wrapper.getSelection()).toBe(null);
        assertHasNotFocused();
      });

      it('returns selection (when single)', () => {
        const selection = wrapper.getSelection();
        expect(selection.anchor.ch).toBe(5);
        expect(selection.head.ch).toBe(9);
        assertHasNotFocused();
      });

      it('returns first selection (when multiple)', () => {
        cm.addSelection({ line: 0, ch: 11 }, { line: 0, ch: 12 });
        const selection = wrapper.getSelection();
        expect(selection.anchor.ch).toBe(5);
        expect(selection.head.ch).toBe(9);
        assertHasNotFocused();
      });
    });

    it('reduces to primary selection', () => {
      cm.addSelection({ line: 0, ch: 11 }, { line: 0, ch: 12 });
      wrapper.usePrimarySelection();
      expect(cm.getSelections().length).toBe(1);
      assertHasFocused();
    });

    it('selects text', () => {
      cm.setCursor({ line: 0, ch: 0 });
      wrapper.select({ line: 0, ch: 0 }, { line: 0, ch: 1 });
      expect(wrapper.getSelectedText()).toBe('S');
      assertHasFocused();
    });

    it('selects backwards, skipping some initial chars', () => {
      cm.setCursor({ line: 0, ch: 4 });
      wrapper.selectBackwards(1, 2);
      expect(wrapper.getSelectedText()).toBe('om');
      assertHasFocused();
    });

    it('extends selection by some number of chars', () => {
      wrapper.extendSelectionBy(2);
      expect(wrapper.getSelectedText()).toBe('text t');
      assertHasFocused();
    });

    it('wraps selection with some prefix/suffix', () => {
      wrapper.wrapSelection('**');
      expect(wrapper.lineStartsWith('Some **text** ')).toBe(true);
    });
  });
});
