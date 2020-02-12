import _ from 'lodash';
import { getModule } from 'NgRegistry';
import * as random from 'utils/Random';

/**
 * @description
 * This service creates a function that can be called many times. It returns
 * a promise that will be resolved with a result of the last call. If at
 * least one of calls fails, the promise is rejected.
 *
 * There is also a special version of this function suffixed with ".hasToFinish".
 * If used, the queue will wait for this single call to finish before
 * resolving the promise.
 */

export function createRequestQueue(requestFn, onceFn) {
  let deferred, requests, required, performed;
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
      const $q = getModule('$q');
      deferred = $q.defer();
      if (_.isFunction(onceFn)) {
        onceFn(deferred.promise);
      }
    }

    requests.push(opts.id);
    if (opts.required) {
      required.push(opts.id);
    }

    requestFn(...opts.args).then(createResponseHandler(opts.id), handleError);

    return deferred.promise;
  }

  function createResponseHandler(id) {
    return function handleResponse(response) {
      // mark request as performed
      performed[id] = true;

      // remove from the list of required requests (if was required)
      const requiredIndex = required.indexOf(id);
      if (requiredIndex > -1) {
        required.splice(requiredIndex, 1);
      }

      // resolve if all required requests and the last one were performed
      const lastId = _.last(requests);
      if (required.length < 1 && performed[lastId]) {
        deferred.resolve(response);
        reset();
      }
    };
  }

  function handleError(err) {
    // reject only if wasn't resolved or rejected yet
    if (deferred) {
      deferred.reject(err);
    }

    reset();
  }

  function reset() {
    deferred = null;
    requests = [];
    required = [];
    performed = {};
  }
}
