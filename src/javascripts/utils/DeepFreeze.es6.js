import {isObjectLike, cloneDeep} from 'lodash';

/**
 * @ngdoc service
 * @module cf.utils
 * @name utils/DeepFreeze
 */


/**
 * @ngdoc method
 * @module cf.utils
 * @name utils/DeepFreeze#deepFreeze
 * @description
 * Freezes an object or array recursively and returns it.
 *
 * @param {object|array} target
 * @returns {object|array}
 */
export function deepFreeze (o) {
  try {
    if (Object.isFrozen(o)) {
      return o;
    }
  } catch (e) {
    // ES5 throws TypeError if not an object. ES6 is ok.
    return o;
  }

  try {
    Object.freeze(o);
  } catch (e) {
    // ES5 throws TypeError if not an object. ES6 is ok.
  }

  if (Array.isArray(o)) {
    o.forEach(deepFreeze);
  } else if (isObjectLike(o)) {
    Object.getOwnPropertyNames(o).forEach(function (prop) {
      deepFreeze(o[prop]);
    });
  }

  return o;
}


/**
 * @ngdoc method
 * @module cf.utils
 * @name utils/DeepFreeze#deepFreezeClone
 * @description
 * Shorthand method to create a deep copy of an object or array, and freeze it.
 *
 * @param {object|array} target
 * @returns {object|array}
 */
export function deepFreezeClone (o) {
  return deepFreeze(cloneDeep(o));
}
