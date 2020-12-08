import { equalArrays } from './equalArrays';

describe('utils: equalArrays', () => {
  it('returns "false" when two different arrays are compared', () => {
    expect(equalArrays(['123', '345'], ['123', '346'])).toBe(false);
  });

  it('returns "true" when two equal arrays are compared', () => {
    expect(equalArrays(['123', '345'], ['123', '345'])).toBe(true);
  });

  it('can compare two empty arrays', () => {
    expect(equalArrays([], [])).toBe(true);
  });

  it('can compare an empty array against an array with elements', () => {
    expect(equalArrays([], ['1', '2'])).toBe(false);
    expect(equalArrays(['1', '2'], [])).toBe(false);
  });

  it('handles the case when one of the arrays is undefined (TS violation)', () => {
    expect(equalArrays(undefined, ['123', '345'])).toBe(false);
    expect(equalArrays(undefined, ['123', '345'])).toBe(false);
  });
});
