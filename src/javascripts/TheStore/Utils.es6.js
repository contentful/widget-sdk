import * as K from 'utils/kefir.es6';
import window from 'global/window';
import { partial, isString } from 'lodash';

/*
  This module provides methods to be exposed by a given storage, as utilities.
  Each utility, with the exception of `externalChanges` must be given a specific
  storage (LocalStorage, SessionStorage, CookieStorage) as the first argument.
 */

/**
 * @ngdoc method
 * @name TheStore#set
 * @param {string} key
 * @param {*} value
 * @param {['local', 'session']} storageType
 * @description
 * Stores the value under the key. Replaces current value, if already set.
 */
export function set(storage, key, value) {
  value = isString(value) ? value : JSON.stringify(value);
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
export function get(storage, key) {
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
export function remove(storage, key) {
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
export function has(storage, key) {
  return get(storage, key) !== null;
}

/**
 * Watches the `storage` window method and provides a
 * Kefir.fromEvents object that will update when the
 * provided `key` is updated.
 * @param  {string} key
 * @return {Kefir stream}
 */
export function externalChanges(key) {
  return K.fromEvents(window, 'storage')
    .filter(event => event.key === key)
    .map(event => event.newValue);
}

/**
 * Returns a storage-like object that is parameterized by
 * a given storage and key.
 * @param  {Storage} storage
 * @param  {string} key
 * @return {Object}
 */
export function forKey(storage, key) {
  return {
    get: partial(get, storage, key),
    set: partial(set, storage, key),
    remove: partial(remove, storage, key),
    has: partial(has, storage, key),
    externalChanges: partial(externalChanges, key)
  };
}

/**
 * Returns a storage-like object that is parameterized
 * by the given storage.
 * @param  {Storage} storage
 * @return {Object}
 */
export function forStorage(storage) {
  return {
    get: partial(get, storage),
    set: partial(set, storage),
    remove: partial(remove, storage),
    has: partial(has, storage),
    externalChanges: externalChanges,
    forKey: partial(forKey, storage)
  };
}
