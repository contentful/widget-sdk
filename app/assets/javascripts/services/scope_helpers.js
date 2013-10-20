'use strict';
angular.module('contentful').run(['$rootScope', function($rootScope){

  // Wait until exp return true-ish, then run fn once
  $rootScope.waitFor = function (exp, fn, eq) {
    var d = this.$watch(exp, function(n, old, scope){
      if (n) {
        try {
          fn(n, old, scope);
        } finally {
          d();
          d = null;
        }
      }
    }, eq);

    this.$on('$destroy', function () {
      if (d) d();
    });
  };

  // Handle an event exactly once
  $rootScope.one = function (event, handler) {
    var d = this.$on(event, function () {
      try {
        handler.apply(undefined, arguments);
      } finally {
        d();
        d = null;
      }
    });
    this.$on('$destroy', function () {
      if (d) d();
    });
  };
}]);
