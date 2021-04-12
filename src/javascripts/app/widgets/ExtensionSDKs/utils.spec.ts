import { cleanupJSONValue } from './utils';

describe('cleanupJSONValue', () => {
  it('cleans primitives', () => {
    expect(cleanupJSONValue(42)).toBe(42);
    expect(cleanupJSONValue('test string')).toBe('test string');
    expect(cleanupJSONValue(null)).toBeNull();
    expect(cleanupJSONValue(false)).toBe(false);
    expect(cleanupJSONValue(true)).toBe(true);

    expect(cleanupJSONValue(undefined)).toBeUndefined();
  });

  it('converts undefined in arrays to null', () => {
    expect(cleanupJSONValue([])).toStrictEqual([]);
    expect(cleanupJSONValue([42, undefined, 'test string', false])).toStrictEqual([
      42,
      null,
      'test string',
      false,
    ]);
    expect(cleanupJSONValue([undefined, undefined])).toStrictEqual([null, null]);
  });

  it('removes undefined values from objects', () => {
    expect(cleanupJSONValue({})).toStrictEqual({});
    expect(cleanupJSONValue({ key: 'value' })).toStrictEqual({ key: 'value' });
    expect(cleanupJSONValue({ key: 'value', otherkey: undefined })).toStrictEqual({ key: 'value' });
  });

  it('cleans nested objects', () => {
    expect(
      cleanupJSONValue({
        key: [undefined, 42, 'test string'],
        otherkey: {
          array: [42, undefined],
          object: { key: 'value' },
        },
        thirdkey: undefined,
      })
    ).toStrictEqual({
      key: [null, 42, 'test string'],
      otherkey: { array: [42, null], object: { key: 'value' } },
    });
  });

  it('returns date as-is', () => {
    const date = new Date();
    expect(cleanupJSONValue(date)).toBe(date);
  });
});
