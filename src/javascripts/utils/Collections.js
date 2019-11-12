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
export function assign(...objects) {
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
export function update(collection, path, f) {
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

function setFlat(container, key, value) {
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
export function set(container, path, value) {
  return update(container, path, () => value);
}

/**
 * Works just like `lodash.get()` with two differences.
 *
 * - Returns the whole object if the path is empty.
 * - If `path` is not an array it is treated as a single key and not split on
 *   dots.
 */
export function get(container, path, fallbackValue) {
  if (!Array.isArray(path)) {
    if (container && path in container) {
      return container[path];
    } else {
      return fallbackValue;
    }
  }

  if (path.length === 0) {
    return container || fallbackValue;
  } else {
    return lodash.get(container, path, fallbackValue);
  }
}

export function push(as, a) {
  return shallowFreeze([...as, a]);
}

export function map(collection, fn) {
  return shallowFreeze(lodash.map(collection, fn));
}

export function filter(collection, fn) {
  return shallowFreeze(lodash.filter(collection, fn));
}

export function concat(...arrays) {
  return shallowFreeze(
    arrays.reduce((concatted, array) => {
      if (!Array.isArray(array)) {
        throw new TypeError('Arguments to Collections.concat must be arrays');
      }
      return concatted.concat(array);
    })
  );
}

export function slice(as, start, end) {
  return shallowFreeze(as.slice(start, end));
}

export function drop(as, n) {
  if (n > 0) {
    return shallowFreeze(as.slice(n));
  } else if (n < 0) {
    return shallowFreeze(as.slice(0, n));
  } else {
    return as;
  }
}

export function unshift(as, a) {
  return shallowFreeze([a, ...as]);
}

export function insertAt(arr, index, item) {
  return shallowFreeze([...arr.slice(0, index), item, ...arr.slice(index)]);
}

export function move(arr, oldIndex, newIndex) {
  if (!Array.isArray(arr) || typeof oldIndex !== 'number' || typeof newIndex !== 'number') {
    throw new TypeError('Arguments to Collections.move must be (array, number, number)');
  }
  if (oldIndex < 0 || newIndex < 0 || oldIndex >= arr.length || newIndex >= arr.length) {
    throw new TypeError('Indexes provided to Collections.move should be in 0, arr.length-1 range');
  }

  return oldIndex === newIndex
    ? arr
    : insertAt([...arr.slice(0, oldIndex), ...arr.slice(oldIndex + 1)], newIndex, arr[oldIndex]);
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
export function findMap(collection, fn) {
  let foundValue;
  lodash.find(collection, (value, index) => {
    foundValue = fn(value, index);
    return foundValue !== undefined;
  });
  return foundValue;
}
