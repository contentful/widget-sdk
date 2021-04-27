import { serializeJSONValue } from './utils';

describe('serializeJSONValue', () => {
  it('cleans primitives', () => {
    expect(serializeJSONValue(42)).toBe(42);
    expect(serializeJSONValue('test string')).toBe('test string');
    expect(serializeJSONValue(null)).toBeNull();
    expect(serializeJSONValue(false)).toBe(false);
    expect(serializeJSONValue(true)).toBe(true);

    expect(serializeJSONValue(undefined)).toBeUndefined();
  });

  it('converts undefined in arrays to null', () => {
    expect(serializeJSONValue([])).toStrictEqual([]);
    expect(serializeJSONValue([42, undefined, 'test string', false])).toStrictEqual([
      42,
      null,
      'test string',
      false,
    ]);
    expect(serializeJSONValue([undefined, undefined])).toStrictEqual([null, null]);
  });

  it('removes undefined values from objects', () => {
    expect(serializeJSONValue({})).toStrictEqual({});
    expect(serializeJSONValue({ key: 'value' })).toStrictEqual({ key: 'value' });
    expect(serializeJSONValue({ key: 'value', otherkey: undefined })).toStrictEqual({
      key: 'value',
    });
  });

  it('cleans nested objects', () => {
    expect(
      serializeJSONValue({
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

  it('returns date as ISO strings', () => {
    const date = new Date();
    expect(serializeJSONValue(date)).toBe(date.toISOString());
  });
});
