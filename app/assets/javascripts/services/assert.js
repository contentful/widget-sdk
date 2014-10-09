'use strict';

angular.module('contentful').service('assert', ['$parse', function($parse) {

  function makeException(path, message) {
    var str = message ? message+': ' : '';
    str += 'Assertion failed on '+path;
    return new Error(str);
  }

  function assertObject(obj, message) {
    if(!obj) throw makeException('object', message);
  }

  function getPath(obj, keys) {
    if (obj === undefined) return undefined;
    if (keys.length === 0) return obj;
    if (obj === null) return undefined;
    return getPath(obj[_.first(keys)], _.rest(keys));
  }

  function isNotValid(result) {
    return _.isNull(result) || _.isUndefined(result);
  }

  return {
    makeException: makeException,

    object: assertObject,

    path: function assertPath(obj, path, message) {
      var keys = path.split('.');
      if(isNotValid(getPath(obj, keys))) throw makeException(path, message);
    },

    scopePath: function assertScopePath(scope, path, message) {
      assertObject(scope);
      if(isNotValid($parse(path)(scope))) throw makeException(path, message);
    },

    truthy: function (value, message) {
      if(!value) throw makeException(value, message);
    },

    defined: function(value, message) {
      this.truthy(value, message);
    }
  };
}]);
