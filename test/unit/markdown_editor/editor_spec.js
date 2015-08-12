'use strict';

describe('Markdown editor', function () {
  var $timeout;
  var textarea, editor, actions, wrapper, cm;
  var libs = window.cfLibs.markdown;

  beforeEach(function () {
    module('contentful/test');
    $timeout = this.$inject('$timeout');
    var MarkdownEditor = this.$inject('MarkdownEditor');
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    editor = MarkdownEditor.createManually(textarea, libs.CodeMirror, libs.marked);
    actions = editor.actions;
    wrapper = editor.getWrapper();
    cm = wrapper.getEditor();
  });

  describe('Synchronization', function () {
    it('allows to register notification callback', function () {
      var notificationSpy = sinon.stub();
      editor.subscribe(notificationSpy);
      editor.setContent('test');
      $timeout.flush();
      sinon.assert.called(notificationSpy);
    });

    it('notifies only when value is changed', function () {
      var notificationSpy = sinon.spy();
      editor.subscribe(notificationSpy);
      $timeout.flush();
      sinon.assert.calledOnce(notificationSpy);
      $timeout.flush();
      sinon.assert.calledOnce(notificationSpy);
      editor.insert('test');
      $timeout.flush();
      sinon.assert.calledTwice(notificationSpy);
    });

    it('notifies with editor detailed information', function (done) {
      editor.subscribe(function (value, html, info) {
        expect(value).toBe('__test__');
        expect(html.trim()).toBe('<p><strong>test</strong></p>');
        expect(info.words).toBe(1);
        expect(info.chars).toBe(8);
        done();
      });

      editor.setContent('__test__');
      $timeout.flush();
    });

    it('stops notifying after editor is destroyed', function () {
      var notificationSpy = sinon.spy();
      editor.subscribe(notificationSpy);
      editor.setContent('test');
      editor.destroy();
      $timeout.flush();
      sinon.assert.notCalled(notificationSpy);
    });
  });

  describe('Actions', function () {
    describe('inline actions', function () {
      var inlineActions = [
        { action: 'bold', prefix: '__', hint: 'text in bold' },
        { action: 'italic', prefix: '*', hint: 'text in italic' },
        { action: 'strike', prefix: '~~', hint: 'striked out' }
      ];

      inlineActions.forEach(function (item) {
        it('for ' + item.action + ': inserts sample text and selects content', function () {
          actions[item.action]();
          expect(cm.getValue()).toBe(item.prefix + item.hint + item.prefix);
          var selection = wrapper.getSelection();
          expect(selection.anchor.ch).toBe(item.prefix.length);
          expect(selection.head.ch).toBe(item.prefix.length + item.hint.length);
        });
      });

      inlineActions.forEach(function (item) {
        it('for ' + item.action + ': wraps selection', function () {
          var words = ['super', 'hyper', 'extra'];
          wrapper.setValue(words.join(' '));
          wrapper.select({ line: 0, ch: 6 }, { line: 0, ch: 11 });
          actions[item.action]();
          var val = wrapper.getValue();
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

    describe('headers', function () {
      var headers = { h1: '#', h2: '##', h3: '###' };

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
      var hrMarkup = '\n---\n\n';

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
      var markers = { code: '    ', quote: '> ' };

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
          var initialValue = 'one\ntwo\nthree';
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
      var initialValue = 'one\ntwo\nthree';
      var lists = { ul: '- ', ol: '1. ' };
      var other = { ul: 'ol', ol: 'ul' };
      var lineCheckers = {
        ul: function (line) { expect(line.substring(0, 2)).toBe('- '); },
        ol: function (line, i) { expect(line.substring(0, 3)).toBe('' + (i+1) + '. '); }
      };

      function selectAll() { cm.setSelection({ line: 0, ch: 0 }, { line: 2, ch: Infinity }); }

      _.forEach(lists, function (prefix, list) {
        it('for ' + list + ': inserts marker in empty line', function () {
          actions[list]();
          expect(cm.getValue()).toBe(prefix);
          expect(wrapper.getCurrentCharacter()).toBe(prefix.length);
        });

        it('for ' + list + ': toggles line to list item', function () {
          cm.setValue('test');
          cm.setCursor({ line: 0, ch: 2 });
          actions[list]();
          expect(cm.getValue()).toBe(prefix + 'test');
          expect(wrapper.getCurrentCharacter()).toBe(2 + prefix.length);
          actions[list]();
          expect(cm.getValue()).toBe('test');
          expect(wrapper.getCurrentCharacter()).toBe(2);
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
          var secondType = other[list];
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
      actions.table({ rows: 2, cols: 3, width: 5 });
      var expected = [
        '| ?     | ?     | ?     |',
        '| ----- | ----- | ----- |',
        '| ?     | ?     | ?     |'
      ].join('\n');
      expect(cm.getValue().indexOf(expected) > -1).toBe(true);
    });
  });

});
