import * as K from 'utils/kefir';
import window from 'global/window';

/**
 * @ngdoc method
 * @name TheStore#set
 * @param {string} key
 * @param {*} value
 * @param {['local', 'session']} storageType
 * @description
 * Stores the value under the key. Replaces current value, if already set.
 */
export function set (storage, key, value) {
  value = _.isString(value) ? value : JSON.stringify(value);
  storage.set(key, value);
}

/**
 * @ngdoc method
 * @name TheStore#get
 * @param {string} key
 * @param {['local', 'session']} storageType
 * @returns {*|null}
 * @description
 * Gets the value under the key. Returns null when value is not set.
 */
export function get (storage, key) {
  const value = storage.get(key) || 'null';

  try {
    return JSON.parse(value);
  } catch (ex) {
    return value;
  }
}

/**
 * @ngdoc method
 * @name TheStore#remove
 * @param {string} key
 * @param {['local', 'session']} storageType
 * @description
 * Removes the values stored under the given key. Silent for non-existent keys.
 */
export function remove (storage, key) {
  storage.remove(key);
}

/**
 * @ngdoc method
 * @name TheStore#has
 * @param {string} key
 * @param {['local', 'session']} storageType
 * @returns {boolean}
 * @description
 * Returns boolean indicating value presence under the given key.
 */
export function has (storage, key) {
  return get(storage, key) !== null;
}

export function externalChanges (storage, key) {
  const type = storage.type;

  return K.fromEvents(window, type)
    .filter(function (event) {
      return event.key === key;
    })
    .map(function (event) {
      return event.newValue;
    });
}


/**
 * @ngdoc method
 * @name TheStore#forKey
 * @param {string} key
 * @description
 * Returns an object with `get()` and `set()` methods that are
 * parameterized by the `key` argument.
 *
 * ~~~js
 * var mystore = TheStore.forKey('mykey')
 * TheStore.set('mykey', true);
 * assert(mystore.get() === true)
 * mystore.set('Hello')
 * assert(TheStore.get('mykey') === 'Hello')
 * ~~~
 */
export function forKey (storage, key) {
  return {
    get: _.partial(get, storage, key),
    set: _.partial(set, storage, key),
    remove: _.partial(remove, storage, key),
    has: _.partial(has, storage, key),
    externalChanges: _.partial(externalChanges, storage, key),
    type: storage.type
  };
}

export function forStorage (storage) {
  return {
    get: _.partial(get, storage),
    set: _.partial(set, storage),
    remove: _.partial(remove, storage),
    has: _.partial(has, storage),
    externalChanges: _.partial(externalChanges, storage),
    forKey: _.partial(forKey, storage),
    type: storage.type
  };
}
