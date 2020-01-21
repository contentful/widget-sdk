import moment from 'moment';
import { getModule } from 'NgRegistry';
import { getEndpoint, getCurrentState } from './Utils';
import * as Telemetry from 'i13n/Telemetry';

const CALLS_IN_PERIOD = 7;
const PERIOD = 1000;
const DEFAULT_TTL = 5;
const RATE_LIMIT_EXCEEDED = 429;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

/**
 * @ngdoc service
 * @name data/Request/Retry

 * @description
 * Queue wrapper for api requests
 * Wrapped requests will retry automatically when rate limit is exceeded,
 * and on certain api errors (codes: 429, 502, 503, 504)

 * @param {function} request function ($http(...))
 * @returns {function} wrapped request function
 */
export default function wrapWithRetry(requestFn) {
  const $q = getModule('$q');
  const $timeout = getModule('$timeout');

  let inFlight = 0;
  const queue = [];

  return function push() {
    const deferred = $q.defer();

    queue.push({
      deferred,
      args: Array.prototype.slice.call(arguments),
      ttl: DEFAULT_TTL,
      wait: 0
    });
    shift();

    return deferred.promise;
  };

  // the time sent here includes time needed to run the requestFn
  // and the time it takes the JS runtime to have the resolve/reject
  // handlers execute. Therefore, it is off from the times reported
  // by the Network tab in your dev tools by a few milliseconds to
  // tens of millisecond at worst (as per my limited testing).
  function recordResponseTime({ status }, startTime, { url, method } = {}) {
    try {
      Telemetry.record('cma-response-time', now() - startTime, {
        endpoint: getEndpoint(url),
        status,
        method
      });
    } catch (_) {
      // no-op
    }
  }

  function shift() {
    if (inFlight >= CALLS_IN_PERIOD || queue.length < 1) {
      return;
    }

    const start = now();
    const call = queue.shift();
    inFlight += 1;

    $timeout(call.wait)
      .then(() => requestFn(...call.args))
      .then(
        res => {
          recordResponseTime(res, start + call.wait, ...call.args);
          return res;
        },
        err => {
          recordResponseTime(err, start + call.wait, ...call.args);
          return $q.reject(err);
        }
      )
      .then(handleSuccess, handleError)
      .then(completePeriod)
      .then(() => {
        inFlight -= 1;
        shift();
      });

    function handleSuccess(res) {
      call.deferred.resolve(res);
    }

    function handleError(err) {
      if (err.status === RATE_LIMIT_EXCEEDED && call.ttl > 0) {
        try {
          const [{ url } = {}] = call.args;

          Telemetry.count('cma-rate-limit-exceeded', {
            endpoint: getEndpoint(url),
            state: getCurrentState()
          });
        } catch (_) {
          // no op
        }

        queue.unshift(backOff(call));
      } else if (
        [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT].indexOf(err.status) > -1 &&
        call.ttl > 0
      ) {
        call.ttl -= 1;
        queue.unshift(call);
      } else {
        call.deferred.reject(err);
      }
    }

    function completePeriod() {
      const duration = now() - start;
      if (duration < PERIOD) {
        return $timeout(PERIOD - duration);
      }
    }
  }
}

function backOff(call) {
  call.ttl -= 1;
  const attempt = DEFAULT_TTL - call.ttl;
  call.wait = Math.random() * Math.pow(2, attempt) * PERIOD;
  return call;
}

function now() {
  return moment().valueOf();
}
