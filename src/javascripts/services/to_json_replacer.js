'use strict';
angular.module('contentful').constant('toJsonReplacer', function toJsonReplacer(key, value) {
  var val = value;

  if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
    val = undefined;
  }

  return val;
});
