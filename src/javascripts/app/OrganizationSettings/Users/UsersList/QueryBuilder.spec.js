import { formatQuery } from './QueryBuilder.es6';

describe('QueryBuilder', () => {
  const filterA = {
    key: 'sys.space.sys.id',
    operator: null,
    value: 'pizzaspace'
  };
  const filterB = {
    key: 'roles.name',
    operator: 'matches',
    value: 'editor'
  };
  const filterC = {
    key: 'sys.user.firstName',
    operator: null,
    value: ''
  };

  it('does not break if no filters are given', () => {
    expect(formatQuery()).toEqual({});
  });

  it('formats a simple filter', () => {
    const query = formatQuery([filterA]);
    expect(query).toEqual({ 'sys.space.sys.id': 'pizzaspace' });
  });

  it('formats a with an operator', () => {
    const query = formatQuery([filterB]);
    expect(query).toEqual({ 'roles.name[matches]': 'editor' });
  });

  it('ignores filters that have no value', () => {
    const query = formatQuery([filterC]);
    expect(query).toEqual({});
  });

  it('does not ignore filters that have false as value', () => {
    const query = formatQuery([
      {
        key: 'sys.user.firstName',
        operator: 'exists',
        value: false
      }
    ]);
    expect(query).toEqual({ 'sys.user.firstName[exists]': false });
  });

  it('formats multiple filters into one query', () => {
    const query = formatQuery([filterA, filterB, filterC]);
    expect(query).toEqual({
      'sys.space.sys.id': 'pizzaspace',
      'roles.name[matches]': 'editor'
    });
  });
});
