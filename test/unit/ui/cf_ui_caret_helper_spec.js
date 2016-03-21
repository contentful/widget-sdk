'use strict';

describe('ui/caretHelper service', function () {
  beforeEach(function () {
    module('contentful/test');

    var uiCaretHelper = this.$inject('ui/caretHelper');

    this.getPreservedCaretPosition = uiCaretHelper.getPreservedCaretPosition;
    this.makeInputUpdater = uiCaretHelper.makeInputUpdater;
  });

  describe('#getPreservedCaretPosition()', function () {
    describe('Characters added before caret', function () {
      it('should return current caret position + number of chars added', function () {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'xabcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(4);
      });
    });

    describe('Characters added after caret', function () {
      it('should return current caret position unchanged', function () {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'abcd x';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('Characters removed before caret', function () {
      it('should return current caret position - number of chars removed', function () {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'cd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(1);

      });
    });

    describe('Characters removed after caret', function () {
      it('should return current caret position unchanged', function () {
        var currentCaretPosition = 3;
        var currentValue = 'abcdef';
        var newValue = 'abcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('Nothing is changed', function () {
      it('should return current caret position', function () {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'abcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('New or current value is non-string', function () {
      it('should throw', function () {
        var currentCaretPosition = 3;
        var currentValue = 1234;
        var newValue = 91234;

        expect(this.getPreservedCaretPosition.bind(this, currentCaretPosition, currentValue, newValue)).toThrow();
      });
    });
  });

  describe('#makeInputUpdater()', function () {
    var $inputEl = $('<input type="text" />');
    var rawInputEl = $inputEl.get(0);

    function resetInputAndCaret() {
      $inputEl.val('thisissparta');
      rawInputEl.selectionStart = rawInputEl.selectionEnd = 3;
    }

    it('should return a function that updates an input field while preserving caret position', function () {
      var updateWhilePreservingCaret = this.makeInputUpdater($inputEl);

      resetInputAndCaret();
      updateWhilePreservingCaret('xthisissparta');
      expect(rawInputEl.selectionStart).toEqual(4);

      resetInputAndCaret();
      updateWhilePreservingCaret('thisissparta');
      expect(rawInputEl.selectionStart).toEqual(3);

      resetInputAndCaret();
      updateWhilePreservingCaret('sparta');
      expect(rawInputEl.selectionStart).toEqual(0);

      resetInputAndCaret();
      updateWhilePreservingCaret('thisisspartatotallybruv');
      expect(rawInputEl.selectionStart).toEqual(3);
    });
  });

});
