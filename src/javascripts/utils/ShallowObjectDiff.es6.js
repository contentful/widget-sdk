import { assign, keys } from 'lodash';

/**
 * @usage[js]
 * getChangesObject({a: 10, b: 20, m: Symbol('a')}, {a: 10, b: 30, c: 'test'})
 * // => {b: 30, c: 'test'}
 *
 * @description
 * This method does a trivial shallow diff between two objects
 * and returns a new object which has all key/value pairs from the new
 * object with duplicated and removed keys from old object deleted.
 *
 * @param {Object} oldObj
 * @param {Object} newObj
 * @returns {Object} shallow diff of input objects
 */
export default function(oldObj = {}, newObj = {}) {
  const retObj = assign({}, newObj);

  keys(oldObj).forEach(key => {
    if (oldObj[key] === newObj[key]) {
      delete retObj[key];
    }
  });

  return retObj;
}
