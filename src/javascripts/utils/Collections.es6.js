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


/**
 * Apply a function to the value given by `path` and return a new collection
 * where the value is replaced by the functions return value.
 *
 *     const c = { x: [true] }
 *     assert(c.x[0] === true)
 *
 *     c2 = update(c, ['x', 0], (v) => !v)
 *     assert(c2.x[0] === false)
 *
 * If `path` is an array it must be a list of string or number keys. If `path`
 * is not an array then it is treated as a single key.
 *
 * @param {object|array} collection
 * @param {array|string|number} path
 * @param {function(value)} f
 */
export function update (collection, path, f) {
  if (!Array.isArray(path)) {
    return update(collection, [path], f);
  }

  if (path.length === 0) {
    return shallowFreeze(f(collection));
  } else {
    const [key, ...restPath] = path;
    const innerCollection = collection[key];
    const newInnerCollection = update(innerCollection, restPath, f);
    return setFlat(collection, key, newInnerCollection);
  }
}

function setFlat (container, key, value) {
  if (Array.isArray(container)) {
    if (typeof key !== 'number') {
      throw new TypeError('Collection key for array must be a number');
    }

    const copy = container.slice();
    copy[key] = value;
    return shallowFreeze(copy);
  } else {
    if (typeof key !== 'string') {
      throw new TypeError('Collection key for object must be a string');
    }

    return assign(container, {
      [key]: value
    });
  }
}


/**
 * Return a new collection with the value at the given path replaced by the
 * `value` argument.
 *
 * This is convenience wrapper around `update`. In particular `path` follows the
 * same behavior as described there.
 */
export function set (container, path, value) {
  return update(container, path, () => value);
}


/**
 * Works just like `lodash.get()` with two differences.
 *
 * - Returns the whole object if the path is empty.
 * - If `path` is not an array it is treated as a single key and not split on
 *   dots.
 */
export function get (container, path) {
  if (!Array.isArray(path)) {
    return container[path];
  }

  if (path.length === 0) {
    return container;
  } else {
    return lodash.get(container, path);
  }
}


export function push (as, a) {
  return shallowFreeze([...as, a]);
}

export function concat (...arrays) {
  return shallowFreeze(arrays.reduce((concatted, array) => {
    if (!Array.isArray(array)) {
      throw new TypeError('Arguments to Collections.concat must be arrays');
    }
    return concatted.concat(array);
  }));
}

export function slice (as, start, end) {
  return shallowFreeze(as.slice(start, end));
}

export function unshift (as, a) {
  return shallowFreeze([a, ...as]);
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
 * @param {function(value, index)} fn
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
