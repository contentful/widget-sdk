'use strict';

describe('HashMap', function () {
  var hashMap;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function (HashMap) {
    hashMap = new HashMap();
  }));

  it('should return the same key for the same object', function () {
    var o = {};
    expect(hashMap.hashFor(o)).toBe(hashMap.hashFor(o));
  });

  it('should return different keys for different objects', function () {
    expect(hashMap.hashFor({})).not.toBe(hashMap.hashFor({}));
  });

  it('should allow removing objects', function () {
    var o = {};
    var hash1 = hashMap.hashFor(o);
    hashMap.remove(o);
    expect(hashMap.hashFor(o)).not.toBe(hash1);
  });
});
