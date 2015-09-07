'use strict';

describe('Markdown requirements', function () {
  var Requirements;

  beforeEach(function () {
    module('contentful/test');
    Requirements = this.$inject('MarkdownEditor/requirements');
  });

  describe('Info line', function () {
    var line;
    beforeEach(function () { line = Requirements.getInfoLine; });
    function size(x) { return [{size: x}]; }

    it('no requirements', function () {
      expect(line()).toBe('');
      expect(line([{test: true}])).toBe('');
      expect(line(size(0))).toBe('');
    });

    it('min length requirement only', function () {
      expect(line(size({min: 5}))).toBe('Required characters: min 5');
      expect(line(size({min: 0}))).toBe('');
    });

    it('max length requirement only', function () {
      expect(line(size({max: 100}))).toBe('Required characters: max 100');
    });

    it('min and max requirements', function () {
      expect(line(size({min: 5, max: 100}))).toBe('Required characters: min 5 / max 100');
    });
  });

  describe('Current size marker', function () {
    var mark;
    beforeEach(function () { mark = Requirements.getSizeMarker; });
    function assertCssClass(result, expected) {
      expect(result).toBe('markdown-marker__' + expected);
    }

    it('lower than min, higher than max', function () {
      assertCssClass(mark({min: 5}, 4), 'invalid');
      assertCssClass(mark({max: 30}, 31), 'invalid');
    });

    it('equal and near to min (from right)', function () {
      assertCssClass(mark({min: 5}, 5), 'near');
      assertCssClass(mark({min: 5}, 14), 'near');
    });

    it('near to max (from left) and equal', function () {
      assertCssClass(mark({max: 30}, 21), 'near');
      assertCssClass(mark({max: 30}, 30), 'near');
    });

    it('in valid range', function () {
      assertCssClass(mark({ min: 5, max: 30}, 15), 'ok');
      assertCssClass(mark({ min: 5, max: 30}, 20), 'ok');
    });
  });
});
