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
 * var request = createQueue(fnReturningPromise, function (resultPromise) {
 *   // This (provided optionally) function will be executed once for all
 *   // consecutive calls with a promise of a result. It's helpful for
 *   // attaching final handlers.
 *   resultPromise.then(doSomethingWithData, handleError);
 * });
 *
 * var resultPromise = request();
 * request(secondFnReturningPromise);
 * request();
 *
 * // - "fnReturningPromise" was called two times
 * // - "secondFnReturningPromise" was called once
 * // - "doSomethingWithData" was called once with a result of the last call
 */
.factory('overridingRequestQueue', ['$injector', function ($injector) {

  var $q = $injector.get('$q');

  return function createQueue(defaultRequestFn, onceFn) {
    var deferred = null;
    var requests = [];

    return function request(requestFn) {
      if (!deferred || requests.length < 1) {
        pushRequest(requestFn);
        deferred = $q.defer();
        if (_.isFunction(onceFn)) {
          onceFn(deferred.promise);
        }
        requestNext();
      } else {
        pushRequest(requestFn);
      }

      return deferred.promise;
    };

    function pushRequest(requestFn) {
      requests.push(requestFn || defaultRequestFn);
    }

    function requestNext() {
      requests[requests.length-1]()
      .then(handleResponse)
      .catch(handleError);
    }

    function handleResponse(response) {
      if (!deferred) {
        return;
      }

      requests.pop();
      if (requests.length > 0) {
        requestNext();
      } else {
        deferred.resolve(response);
        deferred = null;
        requests = [];
      }
    }

    function handleError(err) {
      deferred.reject(err);
      deferred = null;
      requests = [];
    }
  };
}]);
