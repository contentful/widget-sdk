'use string';

describe('utils/StringDiff', () => {
  const CHARS = '0123456789abcdefghijklmnopqvwxyzABCDEFGHIJKLMNOPQVWXYZ';
  let diff;

  beforeEach(function() {
    module('cf.utils');
    diff = this.$inject('utils/StringDiff').diff;
  });

  afterEach(() => {
    diff = null;
  });

  it('diffs inserts', () => {
    _.times(1000, () => {
      const a = randomString();
      const p = randomInsert(a.length);
      assertPatchedDiff(a, [p]);
    });
  });

  it('diffs deletes', () => {
    _.times(1000, () => {
      const a = randomString();
      const p = randomDelete(a.length);
      assertPatchedDiff(a, [p]);
    });
  });

  function patch(a, patches) {
    return _.reduce(
      patches,
      (a, p) => {
        let prefix, suffix;
        if (p.insert) {
          prefix = a.slice(0, p.insert[0]);
          suffix = a.slice(p.insert[0]);
          return prefix + p.insert[1] + suffix;
        } else if (p.delete) {
          prefix = a.slice(0, p.delete[0]);
          suffix = a.slice(p.delete[0] + p.delete[1]);
          return prefix + suffix;
        }
      },
      a
    );
  }

  function assertPatchedDiff(a, ps) {
    const b = patch(a, ps);
    expect(patch(a, diff(a, b))).toEqual(b);
  }

  function randomInsert(size) {
    const pos = _.random(0, size);
    const str = randomString();
    return { insert: [pos, str] };
  }

  function randomDelete(size) {
    const pos = _.random(0, size);
    const length = _.random(pos, size);
    return { delete: [pos, length] };
  }

  function randomString() {
    const size = _.random(0, 8);
    return _.times(size, () => randomChar()).join('');
  }

  function randomChar() {
    return CHARS[_.random(0, CHARS.length - 1)];
  }
});
