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
});
