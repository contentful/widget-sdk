import lodash from 'lodash';
import { shallowFreeze } from 'utils/Freeze';

/**
 * This module exports functions that deal with objects and arrays.
 *
 * Altough still incomplete, this module should replace most lodash
 * functions and builtin JS methods and provide some sensible
 * additions.
 *
 * All functions must be pure and return frozen data
 *
 */


/**
 * Pure version of `Object.assign` that returns frozen object.
 */
export function assign (...objects) {
  return shallowFreeze(lodash.assign({}, ...objects));
}


export function push (as, a) {
  return shallowFreeze([...as, a]);
}


/**
 * Applies `fn` to each element in the collection. We return the first
 * result of that application that is not undefined.
 *
 * This is equivalent to but faster than
 *
 *     find(map(collection, fn), (x) => x !== undefined)
 *
 * @param {object|array} collection
 * @param {function(value, index)} collection
 *   For objects 'index' will be a string. For arrays 'index' will be a
 *   number.
 */
export function findMap (collection, fn) {
  let foundValue;
  lodash.find(collection, (value, index) => {
    foundValue = fn(value, index);
    return foundValue !== undefined;
  });
  return foundValue;
}
