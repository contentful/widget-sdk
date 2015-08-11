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
angular.module('contentful').factory('TheStore', ['$injector', function($injector) {

  var localStorageStore = $injector.get('TheStore/localStorageStore');
  var cookieStore       = $injector.get('TheStore/cookieStore');

  var storage = localStorageStore.isSupported() ? localStorageStore : cookieStore;

  return {
    set: set,
    get: get,
    remove: remove,
    has: has
  };

  /**
   * @ngdoc method
   * @name TheStore#set
   * @param {string} key
   * @param {*} value
   * @description
   * Stores the value under the key. Replaces current value, if already set.
   */
  function set(key, value) {
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
  function get(key) {
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
  function remove(key) {
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
  function has(key) {
    return get(key) !== null;
  }
}]);

angular.module('contentful').factory('TheStore/localStorageStore', ['$injector', function($injector) {

  var storage = $injector.get('TheStore/localStorageWrapper');

  return {
    set: set,
    get: get,
    remove: remove,
    isSupported: isSupported
  };

  function set(key, value) {
    storage.setItem(key, value);
  }

  function get(key) {
    return storage.getItem(key);
  }

  function remove(key) {
    storage.removeItem(key);
  }

  function isSupported() {
    try {
      set('test', { test: true });
      remove('test');
      return true;
    } catch (ex) {
      return false;
    }
  }
}]);

angular.module('contentful').factory('TheStore/localStorageWrapper', function() {

  var wrapper = {};
  var methods = ['setItem', 'getItem', 'removeItem'];

  _.forEach(methods, function(method) {
    wrapper[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      return window.localStorage[method].apply(window.localStorage, args);
    };
  });

  return wrapper;
});

angular.module('contentful').factory('TheStore/cookieStore', ['$injector', function($injector) {

  var Cookies = $injector.get('Cookies');
  var config  = $injector.get('environment');

  return {
    set: set,
    get: get,
    remove: remove
  };

  function set(key, value) {
    var attrs = _.extend({ expires: 365 }, _getBaseAttrs());
    Cookies.set(key, value, attrs);
  }

  function get(key) {
    return Cookies.get(key);
  }

  function remove(key) {
    Cookies.remove(key, _getBaseAttrs());
  }

  function _getBaseAttrs() {
    return { secure: config.env !== 'development' };
  }
}]);
