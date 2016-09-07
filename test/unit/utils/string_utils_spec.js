'use strict';

describe('stringUtils service', function () {
  beforeEach(function () {
    module('cf.utils');
    this.utils = this.$inject('stringUtils');
  });

  describe('#joinAndTruncate()', function () {
    it('does not truncate short lists', function () {
      expect(this.utils.joinAndTruncate(split('a b c'), 3))
      .toEqual('a, b and c');
    });

    it('truncates long lists', function () {
      expect(this.utils.joinAndTruncate(split('a b c d'), 2, 'variables'))
      .toEqual('a, b and 2 other variables');
    });

    it('has at least 2 "other" items', function () {
      expect(this.utils.joinAndTruncate(split('a b c'), 2, 'variables'))
      .toEqual('a and 2 other variables');
    });

    function split (string) {
      return string.split(' ');
    }
  });

  describe('#truncate()', function () {
    it('retains short strings', function () {
      expect(this.utils.truncate('abc', 3)).toEqual('abc');
    });

    it('truncates long strings with ellipses', function () {
      expect(this.utils.truncate('abcd', 3)).toEqual('abc…');
    });

    it('omits trailing spaces', function () {
      expect(this.utils.truncate('abc \t\n\r xyz', 8)).toEqual('abc…');
    });

    it('omits orphaned letters', function () {
      expect(this.utils.truncate('go 22 ahead', 4)).toEqual('go…');
    });

    it('does not mistake single chars for orphaned letters', function () {
      expect(this.utils.truncate('go 2 start', 4)).toEqual('go 2…');
    });

    it('cuts off spaces before ellipsis', function () {
      expect(this.utils.truncate('abc  d', 5)).toEqual('abc…');
      expect(this.utils.truncate('go 2 start', 5)).toEqual('go 2…');
      expect(this.utils.truncate('go 2  start', 6)).toEqual('go 2…');
    });

    it('does currently not honor word boundaries other than spaces', function () {
      expect(this.utils.truncate('go-22-ahead', 4)).toEqual('go-2…');
    });
  });

  describe('#truncateMiddle()', function () {
    it('throws an error if string end greater than total length param', function () {
      const call = this.utils.truncateMiddle.bind(null, 'foo', 10, 11);
      expect(call).toThrow();
    });

    it('retains short string', function () {
      expect(this.utils.truncateMiddle('abc', 3, 1)).toEqual('abc');
    });

    it('truncates long strings with ellipses at the middle', function () {
      expect(this.utils.truncateMiddle('abcd', 3, 1)).toEqual('ab…d');
    });

    it('retains short string', function () {
      expect(this.utils.truncateMiddle('abcd', 3, 3)).toEqual('…bcd');
    });

    it('omits orphaned letters before the middle', function () {
      expect(this.utils.truncateMiddle('ab cdefgh xyz', 7, 3)).toEqual('ab…xyz');
    });
  });

  describe('#startsWithVowel', function () {
    let starts;
    beforeEach(function () {
      starts = this.$inject('stringUtils').startsWithVowel;
    });

    it('returns false for non-string or empty string', function () {
      expect(starts({})).toBe(false);
      expect(starts('')).toBe(false);
    });

    it('returns true for strings starting with vowel', function () {
      ['anna', 'eleonore', 'isabel', 'olga', 'ulrika'].forEach(function (name) {
        expect(starts(name)).toBe(true);
        expect(starts(name.toUpperCase())).toBe(true);
      });
    });

    it('returns false for strings that are not starting with vowel', function () {
      ['daisy', 'wanda', 'rachel', 'salomea', 'tania'].forEach(function (name) {
        expect(starts(name)).toBe(false);
        expect(starts(name.toUpperCase())).toBe(false);
      });
    });
  });

  describe('#normalizeWhiteSpace()', function () {
    it('remoes extraneous whitespace', function () {
      expect(this.utils.normalizeWhiteSpace(' a  b   c ')).toEqual('a b c');
    });
  });
});
