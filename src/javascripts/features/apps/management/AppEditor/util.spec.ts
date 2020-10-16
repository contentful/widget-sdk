import { arrayStartsWith } from './util';

describe('arrayStartsWith', () => {
  it('return true for arrays that start with target array', () => {
    expect(arrayStartsWith([0, 1, 2, 3], [0, 1, 2])).toBeTruthy();
    expect(arrayStartsWith(['a', 'b', 'c'], ['a', 'b'])).toBeTruthy();
    expect(arrayStartsWith([0, 1, 2], [0, 1, 2])).toBeTruthy();
    expect(arrayStartsWith([0, 1, 2], [])).toBeTruthy();
    expect(arrayStartsWith([], [])).toBeTruthy();
  });

  it('returns false for arrays that do not start with target array', () => {
    expect(arrayStartsWith([0, 1, 2, 3], [1, 2])).toBeFalsy();
    expect(arrayStartsWith([0, 1, 2, 3], [1, 2, 3, 4])).toBeFalsy();
    expect(arrayStartsWith([], [0, 1, 2])).toBeFalsy();
  });
});
