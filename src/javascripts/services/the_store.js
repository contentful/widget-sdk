'use strict';

angular.module('contentful').factory('TheStore', ['$injector', function($injector) {

  var localStorageStore = $injector.get('TheStore/localStorageStore');
  var cookieStore       = $injector.get('TheStore/cookieStore');

  var storage = _hasLocalStorage() ? localStorageStore : cookieStore;

  return {
    set: set,
    get: get,
    remove: remove,
    has: has
  };

  function set(key, value, expires) {
    value = _.isString(value) ? value : JSON.stringify(value);
    storage.set(key, value, expires);
  }

  function get(key) {
    var value = storage.get(key) || 'null';
    try {
      return JSON.parse(value);
    } catch (ex) {
      return value;
    }
  }

  function remove(key) {
    storage.remove(key);
  }

  function has(key) {
    return get(key) !== null;
  }

  function _hasLocalStorage() {
    var now = 'tmp/' + (new Date()).getTime();
    try {
      window.localStorage.setItem(now, now);
      window.localStorage.removeItem(now);
      return true;
    } catch (ex) {
      return false;
    }
  }
}]);

angular.module('contentful').factory('TheStore/localStorageStore', function() {

  var storage = window.localStorage;

  return {
    set: set,
    get: get,
    remove: remove
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
});

angular.module('contentful').factory('TheStore/cookieStore', ['$injector', function($injector) {

  var Cookies     = $injector.get('Cookies');
  var environment = $injector.get('environment').env;
  var baseAttrs   = { secure: environment !== 'development' };

  return {
    set: set,
    get: get,
    remove: remove
  };

  function set(key, value) {
    var attrs = _.extend({ expires: moment().add(1, 'y') }, baseAttrs);
    Cookies.set(key, value, attrs);
  }

  function get(key) {
    return Cookies.get(key);
  }

  function remove(key) {
    Cookies.remove(key, baseAttrs);
  }
}]);
