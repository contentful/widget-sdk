'use strict';
angular.module('contentful').factory('random', function(){
  var CHARS = '0123456789abcdefghijklmnopqvwxyzABCDEFGHIJKLMNOPQVWXYZ';
  var max   = CHARS.length-1;
  return {
    id: function () {
      return [
        r(true),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
        r(),
      ].join('');
    },
  };

  function r(alpha) {
    var min = alpha ? 10 : 0;
    return CHARS[_.random(min,max)];
  }
});
