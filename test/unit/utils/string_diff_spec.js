'use string';

describe('utils/StringDiff', function () {
  var CHARS = '0123456789abcdefghijklmnopqvwxyzABCDEFGHIJKLMNOPQVWXYZ';
  var diff;

  beforeEach(function () {
    module('cf.utils');
    diff = this.$inject('utils/StringDiff').diff;
  });

  afterEach(function () {
    diff = null;
  });

  it('diffs inserts', function () {
    _.times(1000, function () {
      var a = randomString();
      var p = randomInsert(a.length);
      assertPatchedDiff(a, [p]);
    });
  });

  it('diffs deletes', function () {
    _.times(1000, function () {
      var a = randomString();
      var p = randomDelete(a.length);
      assertPatchedDiff(a, [p]);
    });
  });


  function patch (a, patches) {
    return _.reduce(patches, function (a, p) {
      var prefix, suffix;
      if (p.insert) {
        prefix = a.slice(0, p.insert[0]);
        suffix = a.slice(p.insert[0]);
        return prefix + p.insert[1] + suffix;
      } else if (p.delete) {
        prefix = a.slice(0, p.delete[0]);
        suffix = a.slice(p.delete[0] + p.delete[1]);
        return prefix + suffix;
      }
    }, a);
  }

  function assertPatchedDiff (a, ps) {
    var b = patch(a, ps);
    expect(patch(a, diff(a, b))).toEqual(b);
  }

  function randomInsert (size) {
    var pos = _.random(0, size);
    var str = randomString();
    return {insert: [pos, str]};
  }

  function randomDelete (size) {
    var pos = _.random(0, size);
    var length = _.random(pos, size);
    return {delete: [pos, length]};
  }

  function randomString () {
    var size = _.random(0, 8);
    return _.times(size, function () {
      return randomChar();
    }).join('');
  }

  function randomChar () {
    return CHARS[_.random(0, CHARS.length - 1)];
  }
});
