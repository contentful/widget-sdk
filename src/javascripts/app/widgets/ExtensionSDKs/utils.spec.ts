import { getSerializeJSONValue } from './utils';

describe('serializeJSONValue', () => {
  it('cleans primitives', () => {
    expect(getSerializeJSONValue(42)).toBe(42);
    expect(getSerializeJSONValue('test string')).toBe('test string');
    expect(getSerializeJSONValue(null)).toBeNull();
    expect(getSerializeJSONValue(false)).toBe(false);
    expect(getSerializeJSONValue(true)).toBe(true);

    expect(getSerializeJSONValue(undefined)).toBeUndefined();
  });

  it('converts undefined in arrays to null', () => {
    expect(getSerializeJSONValue([])).toStrictEqual([]);
    expect(getSerializeJSONValue([42, undefined, 'test string', false])).toStrictEqual([
      42,
      null,
      'test string',
      false,
    ]);
    expect(getSerializeJSONValue([undefined, undefined])).toStrictEqual([null, null]);
  });

  it('removes undefined values from objects', () => {
    expect(getSerializeJSONValue({})).toStrictEqual({});
    expect(getSerializeJSONValue({ key: 'value' })).toStrictEqual({ key: 'value' });
    expect(getSerializeJSONValue({ key: 'value', otherkey: undefined })).toStrictEqual({
      key: 'value',
    });
  });

  it('cleans nested objects', () => {
    expect(
      getSerializeJSONValue({
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
    expect(getSerializeJSONValue(date)).toBe(date.toISOString());
  });
});
