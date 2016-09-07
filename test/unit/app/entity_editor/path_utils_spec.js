'use strict';

describe('entityEditor/Document/PathUtils', function () {
  beforeEach(function () {
    module('contentful/test');
    this.utils = this.$inject('entityEditor/Document/PathUtils');
  });

  describe('#isAffecting', function () {
    it('returns true if change at "changePath" affects the value of "valuePath"', function () {
      const fn = this.utils.isAffecting;
      expect(fn(['a'], [])).toBe(true);
      expect(fn([], ['a'])).toBe(true);
      expect(fn(['a'], ['a', 'b'])).toBe(true);
      expect(fn(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(fn(['a', 'b', 'x'], ['a', 'b'])).toBe(true);
    });

    it('returns false if change at "changePath" does not affect the value of "valuePath"', function () {
      const fn = this.utils.isAffecting;
      expect(fn(['x'], ['a', 'b'])).toBe(false);
      expect(fn(['a', 'x'], ['a', 'b'])).toBe(false);
    });
  });

  describe('#findCommonPrefix', function () {
    it('returns the longest shared prefix of given paths', function () {
      const test = (paths, expected) => {
        expect(this.utils.findCommonPrefix(paths)).toEqual(expected);
      };

      test([[]], []);
      test([[], []], []);
      test([['a', 'b'], []], []);
      test([[], ['a', 'b']], []);
      test([['a'], ['b']], []);
      test([['a'], ['a', 'b']], ['a']);
      test([['a', 'b'], ['a', 'b', 'c']], ['a', 'b']);
      test([['a', 'b']], ['a', 'b']);
      test([['foo', 'ba'], ['foo', 'ba']], ['foo', 'ba']);
    });
  });
});
