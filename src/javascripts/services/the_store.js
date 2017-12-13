'use strict';

/**
 * @ngdoc service
 * @name TheStore
 *
 * @description
 * This service is the central point for storing session-related user data.
 * By default it uses localStorage, but falls back gracefully into cookies.
 *
 * Subservices, "localStorageStore" and "cookieStore" implement storage-specific
 * logic. These are NOT intended to be used on their own.
 */
angular.module('contentful')
.factory('TheStore', ['require', function (require) {
  var $window = require('$window');
  var localStorageStore = require('TheStore/localStorageStore');
  var cookieStore = require('TheStore/cookieStore');
  var K = require('utils/kefir');

  var storage = localStorageStore.isSupported() ? localStorageStore : cookieStore;

  return {
    set: set,
    get: get,
    remove: remove,
    has: has,
    forKey: forKey,
    externalChanges: externalChanges
  };

  /**
   * @ngdoc method
   * @name TheStore#set
   * @param {string} key
   * @param {*} value
   * @description
   * Stores the value under the key. Replaces current value, if already set.
   */
  function set (key, value) {
    value = _.isString(value) ? value : JSON.stringify(value);
    storage.set(key, value);
  }

  /**
   * @ngdoc method
   * @name TheStore#get
   * @param {string} key
   * @returns {*|null}
   * @description
   * Gets the value under the key. Returns null when value is not set.
   */
  function get (key) {
    var value = storage.get(key) || 'null';
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
   * @description
   * Removes the values stored under the given key. Silent for non-existent keys.
   */
  function remove (key) {
    storage.remove(key);
  }

  /**
   * @ngdoc method
   * @name TheStore#has
   * @param {string} key
   * @returns {boolean}
   * @description
   * Returns boolean indicating value presence under the given key.
   */
  function has (key) {
    return get(key) !== null;
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
  function forKey (key) {
    return {
      get: _.partial(get, key),
      set: _.partial(set, key),
      remove: _.partial(remove, key),
      has: _.partial(has, key),
      externalChanges: _.partial(externalChanges, key)
    };
  }

  /**
   * @ngdoc method
   * @name TheStore#externalChanges
   * @param {string} key
   * @returns {utils/kefir.property}
   * @description
   * Returns a stream that emits new values when the storage item is
   * updated in another window.
   * ~~~js
   * var mystore = TheStore.forKey('mykey')
   * var myValue$ = mystore.externalChanges();
   * myValue$.onValue((value) => console.log(`Value changed: ${value}`))
   * // in another tab on same domain url:
   * TheStore.forKey('mykey').set('hello')
   * // the first tab logs:
   * 'Value changed: hello'
   * ~~~
   */
  function externalChanges (key) {
    return K.fromEvents($window, 'storage')
      .filter(function (event) {
        return event.key === key;
      })
      .map(function (event) {
        return event.newValue;
      });
  }
}])

.factory('TheStore/localStorageStore', ['require', function (require) {
  var storage = require('TheStore/localStorageWrapper');

  return {
    set: set,
    get: get,
    remove: remove,
    isSupported: isSupported
  };

  function set (key, value) {
    storage.setItem(key, value);
  }

  function get (key) {
    return storage.getItem(key);
  }

  function remove (key) {
    storage.removeItem(key);
  }

  function isSupported () {
    try {
      set('test', { test: true });
      remove('test');
      return true;
    } catch (ex) {
      return false;
    }
  }
}])

.factory('TheStore/localStorageWrapper', function () {
  var wrapper = {};
  var methods = ['setItem', 'getItem', 'removeItem'];

  _.forEach(methods, function (method) {
    wrapper[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      return window.localStorage[method].apply(window.localStorage, args);
    };
  });

  return wrapper;
})

.factory('TheStore/cookieStore', ['require', function (require) {
  var Cookies = require('Cookies');
  var config = require('environment');

  return {
    set: set,
    get: get,
    remove: remove
  };

  function set (key, value) {
    var attrs = _.extend({ expires: 365 }, _getBaseAttrs());
    Cookies.set(key, value, attrs);
  }

  function get (key) {
    return Cookies.get(key);
  }

  function remove (key) {
    Cookies.remove(key, _getBaseAttrs());
  }

  function _getBaseAttrs () {
    return { secure: config.env !== 'development' };
  }
}]);
