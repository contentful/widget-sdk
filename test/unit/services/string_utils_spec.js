'use strict';

describe('stringUtils service', function () {
  beforeEach(module('contentful'));


  describe('#joinAndTruncate()', function () {
    var joinAndTruncate;
    beforeEach(function () {
      joinAndTruncate = this.$inject('stringUtils').joinAndTruncate;
    });

    it('does not truncate short lists', function () {
      expect(joinAndTruncate(split('a b c'), 3))
      .toEqual('a, b and c');
    });

    it('truncates long lists', function () {
      expect(joinAndTruncate(split('a b c d'), 2, 'variables'))
      .toEqual('a, b and 2 other variables');
    });

    it('has at least 2 "other" items', function () {
      expect(joinAndTruncate(split('a b c'), 2, 'variables'))
      .toEqual('a and 2 other variables');
    });

    function split (string) {
      return string.split(' ');
    }
  });

  describe('#truncate()', function () {
    var truncate;
    beforeEach(function () {
      truncate = this.$inject('stringUtils').truncate;
    });

    it('retains short strings', function () {
      expect(truncate('abc', 3)).toEqual('abc');
    });

    it('truncates long strings with ellipses', function () {
      expect(truncate('abcd', 3)).toEqual('abc…');
    });

    it('ommits trailing spaces', function () {
      expect(truncate('abc \t\n\r xyz', 8)).toEqual('abc…');
    });

    it('ommits orphaned letters', function () {
      expect(truncate('abc xyz', 5)).toEqual('abc…');
    });

  });
});
