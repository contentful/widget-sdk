import { isNil } from 'lodash';

/**
 * Transforms a list of filter objects into a query string
 *
 * @usage[js]
 * const filters = [
 *  {key: 'role.name', operator: 'matches', value: 'editor'},
 *  {key: 'sys.space.sys.id', operator: null, value: 'pizzaspace'}
 * ];
 *
 * formatQuery(filters); // {'role.name[matches]': 'editor', 'sys.space.sys.id': 'pizzaspace'}
 * @param {Array.<{key: String, operator: String, value: Any}>} filters
 * @returns {Object}
 */
export function formatQuery(filters = []) {
  const isNilOrEmpty = (value) => value === '' || isNil(value);

  return filters
    .filter(({ value }) => !isNilOrEmpty(value))
    .reduce((memo, { key, operator, value }) => {
      const op = operator ? `[${operator(value)}]` : '';

      memo[`${key}${op}`] = value;

      return memo;
    }, {});
}
