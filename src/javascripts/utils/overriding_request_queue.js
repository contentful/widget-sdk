'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @module cf.utils
 * @name overridingRequestQueue
 * @description
 * This service creates a function that can be called
 * many times. Consecutive calls will be queued and executed
 * one after another. It returns a promise that will
 * be resolved with a result of the last call. If at least
 * one of calls fails, promise is rejected.
 *
 * @usage[js]
 * var createQueue = $injector.get('overridingRequestQueue')
 * var request = createQueue(asyncFunctionReturningPromise);
 *
 * var resultPromise = request(function (resultPromise) {
 *   // this code will be executed once for all consecutive calls
 *   // helpful for attaching final handlers
 *   resultPromise.then(doSomethingWithData, handleError);
 * });
 *
 * request();
 * request();
 *
 * // "asyncFunctionReturningPromise" was called 3 times
 * // "doSomethingWithData" was called once with a result
 * // of the last call
 */
.factory('overridingRequestQueue', ['$injector', function ($injector) {

  var $q = $injector.get('$q');

  return function createQueue(requestFn) {
    var deferred = null;
    var requests = 0;

    return function request(onceFn) {
      if (!deferred || requests < 1) {
        requests = 1;
        deferred = $q.defer();
        if (_.isFunction(onceFn)) {
          onceFn(deferred.promise);
        }
        requestNext();
      } else {
        requests += 1;
      }

      return deferred.promise;
    };

    function requestNext() {
      requestFn()
      .then(handleResponse)
      .catch(handleError);
    }

    function handleResponse(response) {
      if (!deferred) {
        return;
      }

      requests -= 1;
      if (requests > 0) {
        requestNext();
      } else {
        deferred.resolve(response);
        deferred = null;
      }
    }

    function handleError(err) {
      deferred.reject(err);
      deferred = null;
    }
  };
}]);
