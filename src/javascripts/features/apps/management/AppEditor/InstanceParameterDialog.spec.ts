import { validate } from './InstanceParameterDialog';

describe('validate', () => {
  it('returns error for missing instance parameter id', () => {
    const parameter = { id: '', name: 'Name', type: 'Symbol' as const };

    const result = validate(parameter, []);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['id']);
  });

  it('returns error for invalid instance parameter id', () => {
    const parameter = { id: '_invalid', name: 'Name', type: 'Symbol' as const };

    const result = validate(parameter, []);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['id']);
  });

  it('returns error for missing instance parameter name', () => {
    const parameter = { id: 'id', name: '', type: 'Symbol' as const };

    const result = validate(parameter, []);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['name']);
  });

  it('returns error for duplicate option values', () => {
    const parameter = {
      id: 'id',
      name: 'name',
      type: 'Enum' as const,
      options: ['value', 'value'],
    };

    const result = validate(parameter, []);
    expect(result).toHaveLength(2);
    expect(result[0].path).toStrictEqual(['options', 0, 'value']);
    expect(result[1].path).toStrictEqual(['options', 1, 'value']);
  });

  it('returns error for empty option value', () => {
    const parameter = { id: 'id', name: 'name', type: 'Enum' as const, options: [{ '': 'label' }] };

    const result = validate(parameter, []);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['options', 0, 'value']);
  });

  it('returns error for empty option label', () => {
    const parameter = { id: 'id', name: 'name', type: 'Enum' as const, options: [{ value: '' }] };

    const result = validate(parameter, []);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['options', 0, 'label']);
  });
});
