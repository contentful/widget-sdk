'use strict';

describe('CodeMirror wrapper', function () {
  var textarea, wrapper, cm, focusSpy;
  var CodeMirror = window.cfLibs.markdown.CodeMirror;

  function assertHasFocused() { sinon.assert.called(focusSpy); }
  function assertHasNotFocused() { sinon.assert.notCalled(focusSpy); }

  beforeEach(function () {
    module('contentful/test');
    var createWrapper = this.$inject('MarkdownEditor/createCodeMirrorWrapper');
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    wrapper = createWrapper(textarea, {}, CodeMirror);
    cm = wrapper.getEditor();
    focusSpy = sinon.spy();
    cm.on('focus', focusSpy);
  });

  describe('Wrapper creation', function () {
    it('wraps CodeMirror instance', function () {
      expect(cm instanceof CodeMirror).toBe(true);
      expect(cm.getTextArea()).toBe(textarea);
    });

    it('sets options on CodeMirror instance', function () {
      var opt = cm.getOption.bind(cm);
      expect(opt('mode')).toBe('gfm');
      expect(opt('lineNumbers')).toBe(false);
      expect(opt('undoDepth')).toBe(0);
      expect(opt('lineSeparator')).toBe('\n');
      expect(opt('indentUnit')).toBe(2);
    });

    it('restores to original textarea on destroy', function () {
      function countStyles() { return Object.keys(textarea.style).length; }
      expect(countStyles()).toBe(1);
      wrapper.destroy();
      expect(countStyles()).toBe(0);
    });
  });

  describe('Getter methods', function () {
    it('simple getter methods', function () {
      expect(wrapper.getNl()).toBe('\n');
      expect(wrapper.getIndentation()).toBe('  ');
      expect(wrapper.opt('mode')).toBe('gfm');
      assertHasNotFocused();
    });

    it('value getter', function () {
      cm.setValue('test');
      expect(wrapper.getValue()).toBe('test');
      assertHasNotFocused();
    });

    it('line value getter', function () {
      cm.setValue('line 1\nline 2\nline 3, last');
      expect(wrapper.getLine(0)).toBe('line 1');
      expect(wrapper.getLine(1)).toBe('line 2');
      cm.setCursor({ line: 2, ch: 0 });
      expect(wrapper.getCurrentLine()).toBe('line 3, last');
      expect(wrapper.getCurrentLineLength()).toBe(12);
      assertHasNotFocused();
    });

    it('position getters', function () {
      cm.setValue('test\ntest');
      cm.setCursor({ line: 1, ch: 1 });
      expect(wrapper.getCurrentLineNumber()).toBe(1);
      expect(wrapper.getCurrentCharacter()).toBe(1);
      assertHasNotFocused();
    });

    it('starting substring test', function () {
      cm.setValue('testing');
      expect(wrapper.lineStartsWith('test')).toBe(true);
      expect(wrapper.lineStartsWith('xtest')).toBe(false);
      assertHasNotFocused();
    });
  });

  describe('Insertion/replacement/removal methods', function () {
    it('alters value of editor', function () {
      wrapper.setValue('test');
      expect(wrapper.getValue()).toBe('test');
      assertHasNotFocused();
    });

    it('inserts on cursor position', function () {
      cm.setValue('test\nacdef');
      cm.setCursor({ line: 1, ch: 1 });
      wrapper.insertAtCursor('b');
      expect(wrapper.getValue()).toBe('test\nabcdef');
      assertHasFocused();
    });

    it('inserts at the beginning of the line', function () {
      cm.setValue('test\nbcdef');
      cm.setCursor({ line: 1, ch: 3 });
      wrapper.insertAtLineBeginning('a');
      expect(wrapper.getValue()).toBe('test\nabcdef');
      assertHasFocused();
    });

    it('removes from line beginning', function () {
      var val = 'to-be-removed test';
      cm.setValue(val);
      wrapper.removeFromLineBeginning(val.split(' ')[0].length + 1);
      expect(wrapper.getValue()).toBe('test');
      assertHasFocused();
    });

    it('removes selected text', function () {
      cm.setValue('this is not fun');
      cm.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 12 });
      wrapper.removeSelectedText();
      expect(wrapper.getValue()).toBe('this is fun');
      assertHasFocused();
    });

    it('replaces selected text', function () {
      cm.setValue('this is not fun');
      cm.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 11 });
      wrapper.replaceSelectedText('really');
      expect(wrapper.getValue()).toBe('this is really fun');
      assertHasFocused();
    });
  });

  describe('Cursor movement methods', function () {
    var val = 'Some longer line.\nThe next one.';

    beforeEach(function () { cm.setValue(val); });

    it('line jumping, end/beginning', function () {
      cm.setCursor({ line: 0, ch: 3 });
      wrapper.moveToLineBeginning();
      expect(wrapper.getCurrentCharacter()).toBe(0);
      wrapper.moveToLineEnd();
      expect(wrapper.getCurrentCharacter()).toBe(val.split('\n')[0].length);
      assertHasFocused();
    });

    describe('cursor movement', function () {
      it('moves cursor around, within current line', function () {
        wrapper.restoreCursor(2);
        expect(wrapper.getCurrentLineNumber()).toBe(0);
        expect(wrapper.getCurrentCharacter()).toBe(2);
        assertHasFocused();
      });

      it('moves cursor to another line when supplied with one', function () {
        wrapper.restoreCursor(5, 1);
        expect(wrapper.getCurrentLineNumber()).toBe(1);
        expect(wrapper.getCurrentCharacter()).toBe(5);
        assertHasFocused();
      });
    });

    describe('jumping to next line', function () {
      it('moves to next line if current line is not empty', function () {
        cm.setCursor({ line: 0, ch: 2 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(1);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        assertHasFocused();
      });

      it('stays as is if line is empty', function () {
        cm.setValue(val + '\n\ntest');
        cm.setCursor({ line: 2, ch: 0 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(2);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        assertHasNotFocused();
      });

      it('expands current value if in last line', function () {
        cm.setCursor({ line: 1, ch: 3 });
        wrapper.moveIfNotEmpty();
        expect(wrapper.getCurrentLineNumber()).toBe(2);
        expect(wrapper.getCurrentCharacter()).toBe(0);
        expect(wrapper.getCurrentLineLength()).toBe(0);
        assertHasFocused();
      });
    });
  });

  describe('Selection methods', function () {
    var val = 'Some text that will be selected in the future.';

    beforeEach(function () {
      cm.setValue(val);
      cm.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 9 });
    });

    it('selected text getters', function () {
      expect(wrapper.getSelectedText()).toBe('text');
      expect(wrapper.getSelectionLength()).toBe(4);
      assertHasNotFocused();
    });

    describe('selection getter', function () {
      it('returns null when no selection is there', function () {
        cm.setCursor({ line: 0, ch: 0 }); // clear selection this way
        expect(wrapper.getSelection()).toBe(null);
        assertHasNotFocused();
      });

      it('returns selection (when single)', function () {
        var selection = wrapper.getSelection();
        expect(selection.anchor.ch).toBe(5);
        expect(selection.head.ch).toBe(9);
        assertHasNotFocused();
      });

      it('returns first selection (when multiple)', function () {
        cm.addSelection({ line: 0, ch: 11 }, { line: 0, ch: 12 });
        var selection = wrapper.getSelection();
        expect(selection.anchor.ch).toBe(5);
        expect(selection.head.ch).toBe(9);
        assertHasNotFocused();
      });
    });

    it('reduces to primary selection', function () {
      cm.addSelection({ line: 0, ch: 11 }, { line: 0, ch: 12 });
      wrapper.usePrimarySelection();
      expect(cm.getSelections().length).toBe(1);
      assertHasFocused();
    });

    it('selects text', function () {
      cm.setCursor({ line: 0, ch: 0 });
      wrapper.select({ line: 0, ch: 0 }, { line: 0, ch: 1 });
      expect(wrapper.getSelectedText()).toBe('S');
      assertHasFocused();
    });

    it('selects backwards, skipping some initial chars', function () {
      cm.setCursor({ line: 0, ch: 4 });
      wrapper.selectBackwards(1, 2);
      expect(wrapper.getSelectedText()).toBe('om');
      assertHasFocused();
    });

    it('extends selection by some number of chars', function () {
      wrapper.extendSelectionBy(2);
      expect(wrapper.getSelectedText()).toBe('text t');
      assertHasFocused();
    });

    it('wraps selection with some prefix/suffix', function () {
      wrapper.wrapSelection('**');
      expect(wrapper.lineStartsWith('Some **text** ')).toBe(true);
    });
  });

});
