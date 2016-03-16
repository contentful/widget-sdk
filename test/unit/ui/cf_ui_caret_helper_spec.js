'use strict';

describe('cfUiCaretHelper service', function() {
  beforeEach(function () {
    module('contentful/test');

    this.getPreservedCaretPosition = this.$inject('cfUiCaretHelper').getPreservedCaretPosition;
  });

  describe('#getPreservedCaretPosition()', function() {
    describe('Characters added before caret', function() {
      it('should return current caret position + number of chars added', function() {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'xabcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(4);
      });
    });

    describe('Characters added after caret', function() {
      it('should return current caret position unchanged', function() {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'abcd x';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('Characters removed before caret', function() {
      it('should return current caret position - number of chars removed', function() {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'cd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(1);

      });
    });

    describe('Characters removed after caret', function() {
      it('should return current caret position unchanged', function() {
        var currentCaretPosition = 3;
        var currentValue = 'abcdef';
        var newValue = 'abcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('Nothing is changed', function() {
      it('should return current caret position', function() {
        var currentCaretPosition = 3;
        var currentValue = 'abcd';
        var newValue = 'abcd';

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(3);
      });
    });

    describe('New value is non-string', function() {
      it('should coerece it internally and work as described', function() {
        var currentCaretPosition = 3;
        var currentValue = 1234;
        var newValue = 91234;

        expect(this.getPreservedCaretPosition(currentCaretPosition, currentValue, newValue)).toEqual(4);
      });
    });
  });
});
