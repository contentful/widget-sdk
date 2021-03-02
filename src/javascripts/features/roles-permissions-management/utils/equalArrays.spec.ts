import { equalArrayContent } from './equalArrays';

describe('utils: equalArrayContent', () => {
  it('returns "true" when two arrays have the same items, but different order', () => {
    expect(equalArrayContent(['123', '345'], ['345', '123'])).toBe(true);
  });

  it('returns "false" when two different arrays are compared', () => {
    expect(equalArrayContent(['123', '345'], ['123', '346'])).toBe(false);
  });

  it('returns "true" when two equal arrays are compared', () => {
    expect(equalArrayContent(['123', '345'], ['123', '345'])).toBe(true);
  });

  it('can compare two empty arrays', () => {
    expect(equalArrayContent([], [])).toBe(true);
  });

  it('can compare an empty array against an array with elements', () => {
    expect(equalArrayContent([], ['1', '2'])).toBe(false);
    expect(equalArrayContent(['1', '2'], [])).toBe(false);
  });

  it('handles the case when one of the arrays is undefined (TS violation)', () => {
    expect(equalArrayContent(undefined, ['123', '345'])).toBe(false);
    expect(equalArrayContent(['123', '345'], undefined)).toBe(false);
  });

  it('returns "false" when first array is longer than second array', () => {
    expect(equalArrayContent(['123', '345', '567'], ['123', '345'])).toBe(false);
  });

  it('returns "false" when first array is shorter than second array', () => {
    expect(equalArrayContent(['123', '345'], ['123', '345', '567'])).toBe(false);
  });
});
