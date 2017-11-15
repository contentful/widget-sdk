import {isObjectLike, cloneDeep} from 'lodash';

/**
 * Export methods for freezing and cloning
 * - deepFreeze
 * - deepFreezeClone
 */


// Keep references to all objects that failed to freeze.
// These are checked every time and treated as frozen if spotted.
// It prevents infinite recursion for circular references.
const failedToFreeze = [];


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
  if (isFrozen(o)) {
    return o;
  }

  o = shallowFreeze(o);

  if (Array.isArray(o)) {
    o.forEach(deepFreeze);
  } else if (isObjectLike(o)) {
    Object.getOwnPropertyNames(o).forEach(function (prop) {
      deepFreeze(o[prop]);
    });
  }

  return o;
}


export function shallowFreeze (o) {
  if (isFrozen(o)) {
    return o;
  }

  try {
    Object.freeze(o);
  } catch (e) {
    if (Array.isArray(o) || isObjectLike(o)) {
      failedToFreeze.push(o);
    }
    // ES5 throws TypeError if not an object. ES6 is ok.
  }

  return o;
}


function isFrozen (o) {
  if (failedToFreeze.indexOf(o) > -1) {
    return true;
  }

  try {
    return Object.isFrozen(o);
  } catch (e) {
    // ES5 throws TypeError if not an object. ES6 is ok.
    return true;
  }
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
