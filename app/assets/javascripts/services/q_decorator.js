'use strict';
angular.module('contentful').config(function ($provide) {
  
  // Decorates $q instances with the `callback` method
  $provide.decorator('$q', function($delegate, $rootScope){
    var $q = Object.create($delegate);
    // Returns a callback method that should be passed in where a node-style callback is expected.
    // The callback method has a `promise` property that can then be passed around in a promise environment:
    //
    // var cb = $q.callback();
    // asyncMethod(cb);
    // cb.promise.then(...)
    //
    $q.callback = function () {
      var deferred = $delegate.defer();
      var callbackFunction = function (err) {
        var args = Array.prototype.slice.call(arguments, 1);
        $rootScope.$apply(function () {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve.apply(deferred, args);
          }
        });
      };
      callbackFunction.promise = deferred.promise;
      return callbackFunction;
    };
    return $q;
  });
});
