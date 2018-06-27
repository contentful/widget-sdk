'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @module cf.utils
 * @name overridingRequestQueue
 * @description
 * This service creates a function that can be called many times. It returns
 * a promise that will be resolved with a result of the last call. If at
 * least one of calls fails, the promise is rejected.
 *
 * There is also a special version of this function suffixed with ".hasToFinish".
 * If used, the queue will wait for this single call to finish before
 * resolving the promise.
 *
 * Any arguments passed to separate calls will be passed to the base function.
 *
 * @usage[js]
 * var createQueue = require('overridingRequestQueue');
 * var request = createQueue(fnReturningPromise, function (resultPromise) {
 *   // This (provided optionally) function will be executed once for all
 *   // calls with a promise of a result. Helpful attaching final handlers.
 *   resultPromise.then(doSomethingWithData, handleError);
 * });
 *
 * var resultPromise = request();
 * request('x');
 * request();
 *
 * // - "fnReturningPromise" was called w/o arguments two times
 * // - "fnReturningPromise" was called once with ['x'] arguments
 * // - "doSomethingWithData" was called once with a result of the last call
 */
.factory('overridingRequestQueue', ['require', require => {

  var $q     = require('$q');
  var random = require('random');

  return function createQueue(requestFn, onceFn) {
    var deferred, requests, required, performed;
    reset();

    request.hasToFinish = requestRequired;
    request.isIdle = isIdle;

    return request;

    function isIdle() {
      return requests.length === 0;
    }

    function requestRequired(...args) {
      return performRequest(prepareOpts(args, true));
    }

    function request(...args) {
      return performRequest(prepareOpts(args));
    }

    function prepareOpts(argsObj, required) {
      return {
        args: Array.prototype.slice.apply(argsObj),
        id: random.id(),
        required: required || false
      };
    }

    function performRequest(opts) {
      if (!deferred || requests.length < 1) {
        deferred = $q.defer();
        if (_.isFunction(onceFn)) {
          onceFn(deferred.promise);
        }
      }

      requests.push(opts.id);
      if (opts.required) {
        required.push(opts.id);
      }

      requestFn(...opts.args)
      .then(createResponseHandler(opts.id), handleError);

      return deferred.promise;
    }

    function createResponseHandler(id) {
      return function handleResponse(response) {
        // mark request as performed
        performed[id] = true;

        // remove from the list of required requests (if was required)
        var requiredIndex = required.indexOf(id);
        if (requiredIndex > -1) {
          required.splice(requiredIndex, 1);
        }

        // resolve if all required requests and the last one were performed
        var lastId = _.last(requests);
        if (required.length < 1 && performed[lastId]) {
          deferred.resolve(response);
          reset();
        }
      };
    }

    function handleError(err) {
      // reject only if wasn't resolved or rejected yet
      if (deferred) { deferred.reject(err); }

      reset();
    }

    function reset() {
      deferred = null;
      requests = [];
      required = [];
      performed = {};
    }
  };
}]);
