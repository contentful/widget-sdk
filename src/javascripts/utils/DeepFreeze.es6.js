import {isObject} from 'lodash';

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

  if (isObject(o)) {
    Object.getOwnPropertyNames(o).forEach(function (prop) {
      deepFreeze(o[prop]);
    });
  } else if (Array.isArray(o)) {
    o.forEach(function (value) {
      deepFreeze(value);
    });
  }

  return o;
}
