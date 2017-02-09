import $q from '$q';
import $timeout from '$timeout';
import moment from 'moment';
import * as authentication from 'authentication';

const CALLS_IN_PERIOD = 7;
const PERIOD = 1000;
const DEFAULT_TTL = 5;
const RATE_LIMIT_EXCEEDED = 429;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;
const UNAUTHORIZED = 401;

/**
 * @ngdoc service
 * @name data/RequestQueue

 * @description
 * Queue wrapper for api requests
 * Wrapped requests will retry automatically when rate limit is exceeded,
 * and on certain api errors (codes: 429, 401, 502, 503, 504)

 * @param {function} request function ($http(...))
 * @returns {function} wrapped request function
 */
export function create (requestFn) {

  const queue = [];
  let inFlight = 0;

  return function push () {
    const deferred = $q.defer();

    queue.push({
      deferred: deferred,
      args: Array.prototype.slice.call(arguments),
      ttl: DEFAULT_TTL,
      wait: 0
    });
    shift();

    return deferred.promise;
  };

  function shift () {
    if (inFlight >= CALLS_IN_PERIOD || queue.length < 1) {
      return;
    }

    const start = now();
    const call = queue.shift();
    inFlight += 1;

    $timeout(call.wait)
    .then(function () {
      return requestFn.apply(null, call.args);
    })
    .then(handleSuccess, handleError)
    .then(completePeriod)
    .then(function () {
      inFlight -= 1;
      shift();
    });

    function handleSuccess (res) {
      call.deferred.resolve(res);
    }

    function handleError (err) {
      if (call.ttl <= 0) {
        call.deferred.reject(err);
      } else if (err.statusCode === RATE_LIMIT_EXCEEDED) {
        queue.unshift(backOff(call));
      } else if ([BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT].indexOf(err.statusCode) > -1) {
        call.ttl -= 1;
        queue.unshift(call);
      } else if (err.statusCode === UNAUTHORIZED) {
        handleAuthError();
      } else {
        call.deferred.reject(err);
      }
    }

    function handleAuthError (err) {
      if (authentication.isAuthenticating()) {
        queue.unshift(backOff(call));
      } else {
        authentication.loginAfresh().then(function (result) {
          // If authentication started a redirect, don't resolve or reject - just wait
          if (!result.redirect) {
            queue.unshift(call);
          }
        }).catch(function () {
          call.deferred.reject(err);
        });
      }
    }

    function completePeriod () {
      const duration = now() - start;
      if (duration < PERIOD) {
        return $timeout(PERIOD - duration);
      }
    }
  }
}

function backOff (call) {
  call.ttl -= 1;
  const attempt = DEFAULT_TTL - call.ttl;
  call.wait = Math.pow(2, attempt) * PERIOD;
  return call;
}

function now () {
  return moment().valueOf();
}
