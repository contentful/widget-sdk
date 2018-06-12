'use strict';
angular.module('contentful').config(['$provide', $provide => {
  // Decorates $q instances with the `callback` method
  $provide.decorator('$q', ['$delegate', '$rootScope', ($q, $rootScope) => {
    // Returns a callback method that should be passed in where a node-style callback is expected.
    // The callback method has a `promise` property that can then be passed around in a promise environment:
    //
    // var cb = $q.callback();
    // asyncMethod(cb);
    // cb.promise.then(...)
    //
    $q.callbackWithApply = () => {
      var deferred = $q.defer();
      var callbackFunction = function (err) {
        var args = _.tail(arguments);
        $rootScope.$apply(() => {
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

    $q.callback = () => {
      var deferred = $q.defer();
      var callbackFunction = function (err) {
        var args = _.tail(arguments);
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve.apply(deferred, args);
        }
      };
      callbackFunction.promise = deferred.promise;
      return callbackFunction;
    };

    /**
     * Usage:
     *
     * $q.denodeify(function (cb) {
     *   expectsNodeStyleCallback(cb)
     * })
     * .then(
     *   function (result) {},
     *   function (err) {})
     * )
     */
    $q.denodeify = fn => $q((resolve, reject) => {
      try {
        fn(handler);
      } catch (error) {
        handler(error);
      }

      function handler (err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      }
    });

    return $q;
  }]);
}]);
