'use strict';

import { isAffecting, findCommonPrefix, isPrefix } from '../Path.es6';

describe('utils/Path', () => {
  describe('#isAffecting', () => {
    it('returns true if change at "changePath" affects the value of "valuePath"', function() {
      expect(isAffecting(['a'], [])).toBe(true);
      expect(isAffecting([], ['a'])).toBe(true);
      expect(isAffecting(['a'], ['a', 'b'])).toBe(true);
      expect(isAffecting(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(isAffecting(['a', 'b', 'x'], ['a', 'b'])).toBe(true);
    });

    it('returns false if change at "changePath" does not affect the value of "valuePath"', function() {
      expect(isAffecting(['x'], ['a', 'b'])).toBe(false);
      expect(isAffecting(['a', 'x'], ['a', 'b'])).toBe(false);
    });
  });

  describe('#findCommonPrefix', () => {
    it('returns the longest shared prefix of given paths', function() {
      const expectCommonPrefix = (paths, expected) => {
        expect(findCommonPrefix(paths)).toEqual(expected);
      };

      expectCommonPrefix([[]], []);
      expectCommonPrefix([[], []], []);
      expectCommonPrefix([['a', 'b'], []], []);
      expectCommonPrefix([[], ['a', 'b']], []);
      expectCommonPrefix([['a'], ['b']], []);
      expectCommonPrefix([['a'], ['a', 'b']], ['a']);
      expectCommonPrefix([['a', 'b'], ['a', 'b', 'c']], ['a', 'b']);
      expectCommonPrefix([['a', 'b']], ['a', 'b']);
      expectCommonPrefix([['foo', 'ba'], ['foo', 'ba']], ['foo', 'ba']);
    });
  });

  it('#isPrefix', function() {
    const expectIsPrefix = (prefix, target, expected) => {
      expect(isPrefix(prefix, target)).toBe(expected);
    };

    expectIsPrefix([], [], true);
    expectIsPrefix([], ['a'], true);

    expectIsPrefix(['a'], [], false);
    expectIsPrefix(['a'], ['a'], true);
    expectIsPrefix(['a'], ['b'], false);
    expectIsPrefix(['a'], ['a', 'b'], true);

    expectIsPrefix(['a', 'b'], [], false);
    expectIsPrefix(['a', 'b'], ['a'], false);
    expectIsPrefix(['a', 'b'], ['a', 'b'], true);
    expectIsPrefix(['a', 'b'], ['a', 'c'], false);
    expectIsPrefix(['a', 'b'], ['a', 'b', 'c'], true);
    expectIsPrefix(['a', 'b'], ['a', 'd', 'c'], false);
  });
});
