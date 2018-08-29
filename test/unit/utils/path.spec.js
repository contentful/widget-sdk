'use strict';

describe('utils/Path', () => {
  beforeEach(function() {
    module('contentful/test');
    this.utils = this.$inject('utils/Path');
  });

  describe('#isAffecting', () => {
    it('returns true if change at "changePath" affects the value of "valuePath"', function() {
      const fn = this.utils.isAffecting;
      expect(fn(['a'], [])).toBe(true);
      expect(fn([], ['a'])).toBe(true);
      expect(fn(['a'], ['a', 'b'])).toBe(true);
      expect(fn(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(fn(['a', 'b', 'x'], ['a', 'b'])).toBe(true);
    });

    it('returns false if change at "changePath" does not affect the value of "valuePath"', function() {
      const fn = this.utils.isAffecting;
      expect(fn(['x'], ['a', 'b'])).toBe(false);
      expect(fn(['a', 'x'], ['a', 'b'])).toBe(false);
    });
  });

  describe('#findCommonPrefix', () => {
    it('returns the longest shared prefix of given paths', function() {
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

  it('#isPrefix', function() {
    const test = (prefix, target, expected) => {
      expect(this.utils.isPrefix(prefix, target)).toBe(expected);
    };

    test([], [], true);
    test([], ['a'], true);

    test(['a'], [], false);
    test(['a'], ['a'], true);
    test(['a'], ['b'], false);
    test(['a'], ['a', 'b'], true);

    test(['a', 'b'], [], false);
    test(['a', 'b'], ['a'], false);
    test(['a', 'b'], ['a', 'b'], true);
    test(['a', 'b'], ['a', 'c'], false);
    test(['a', 'b'], ['a', 'b', 'c'], true);
    test(['a', 'b'], ['a', 'd', 'c'], false);
  });
});
