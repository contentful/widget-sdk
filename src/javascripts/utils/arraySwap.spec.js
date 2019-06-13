import arraySwap from './arraySwap.es6';

const fixture = [1, 2, 3, 4, 5];

test('utils/arraySwap', () => {
  expect(arraySwap(fixture, 3, 0)).toEqual([4, 1, 2, 3, 5]);
  expect(arraySwap(fixture, -1, 0)).toEqual([5, 1, 2, 3, 4]);
  expect(arraySwap(fixture, 1, -2)).toEqual([1, 3, 4, 2, 5]);
  expect(arraySwap(fixture, -3, -4)).toEqual([1, 3, 2, 4, 5]);
});
