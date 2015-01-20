'use strict';
angular.module('contentful').run(['$rootScope', '$q', function($rootScope, $q){

  // Wait until exp return true-ish, then run fn once
  $rootScope.waitFor = function (exp, fn, eq) {
    var deferred = $q.defer();
    var d = this.$watch(exp, function(n, old, scope){
      if (n) {
        try {
          if (fn) fn(n, old, scope);
        } finally {
          deferred.resolve(n);
          d();
          d = null;
        }
      }
    }, eq);

    this.$on('$destroy', function () {
      if (d) {
        d();
        d=null;
      }
      deferred.reject();
    });

    return deferred.promise;
  };

  // Handle an event exactly once
  $rootScope.one = function (event, handler) {
    var deferred = $q.defer();
    var d = this.$on(event, function () {
      try {
        if (handler) handler.apply(undefined, arguments);
      } finally {
        deferred.resolve(arguments);
        d();
        d = null;
      }
    });
    this.$on('$destroy', function () {
      if (d) {
        d();
        d=null;
      }
      deferred.reject();
    });

    return deferred.promise;
  };

}]);
