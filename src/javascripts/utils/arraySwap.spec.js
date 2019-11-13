import arraySwap from './arraySwap';

const fixture = [1, 2, 3, 4, 5];

describe('utils/arraySwap', () => {
  itSwaps({ from: 3, to: 0, expected: [4, 1, 2, 3, 5] });
  itSwaps({ from: -1, to: 0, expected: [5, 1, 2, 3, 4] });
  itSwaps({ from: 1, to: -2, expected: [1, 3, 4, 2, 5] });
  itSwaps({ from: -3, to: -4, expected: [1, 3, 2, 4, 5] });
  itSwaps({ from: 0, to: 0, expected: fixture });
  itSwaps({ from: -1, to: -1, expected: fixture });
  itSwaps({ from: fixture.length, to: 0, expected: [undefined, ...fixture] });
});

function itSwaps({ from, to, expected }) {
  it(`swaps value at index ${from} to index ${to}`, () => {
    expect(arraySwap(fixture, from, to)).toEqual(expected);
  });
}
