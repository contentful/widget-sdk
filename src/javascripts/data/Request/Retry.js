import * as Telemetry from 'i13n/Telemetry';
import { getEndpoint, getCurrentState, delay } from './Utils';

const RATE_LIMIT_EXCEEDED = 429;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

const CALLS_IN_PERIOD = 7;
const PERIOD = 1000;
const DEFAULT_TTL = 5;

const REPORTING_TIMEOUT = 60 * 1000;

/*
  To better differentiate clients sending events we can manually
  increment this version number if needed.
*/
const CLIENT_VERSION = 1;

export default function withRetry(requestFn) {
  const queue = [];
  let inFlight = 0;

  setInterval(consumeQueue, PERIOD);

  return function addToQueue(...args) {
    return new Promise((resolve, reject) => {
      queue.push({
        resolve,
        reject,
        // original request arguments
        args,
        // time to live
        // how many times we retry before giving up
        ttl: DEFAULT_TTL,
        // time to wait before sending the request
        // some errors cause longer waits before retries
        wait: 0,
        queuedAt: Date.now(),
      });
      attemptImmediate();
    });
  };

  // if there are less then 7 simultaneos requests in fligh, make request immediately
  function attemptImmediate() {
    if (inFlight >= CALLS_IN_PERIOD) {
      return;
    }

    const call = queue.shift();
    doRequest(call);
  }

  async function doRequest(call) {
    const startTime = Date.now();
    inFlight++;

    await delay(call.wait);

    try {
      const response = await requestFn(...call.args);
      recordResponseTime({ status: 200 }, startTime + call.wait, ...call.args);
      recordQueueTime({ status: 200 }, call.queuedAt, ...call.args);
      call.resolve(response);
    } catch (e) {
      handleError(call, e);
      recordResponseTime(e, startTime + call.wait, ...call.args);
    } finally {
      inFlight--;
    }
  }

  // every second, get the first 7 requests in the queue and send them
  function consumeQueue() {
    if (queue.length === 0) return;
    const calls = queue.splice(0, CALLS_IN_PERIOD);
    calls.forEach(doRequest);
  }

  function handleError(call, err) {
    if (err.status === RATE_LIMIT_EXCEEDED && call.ttl > 0) {
      try {
        const [{ url } = {}] = call.args;
        Telemetry.count('cma-rate-limit-exceeded', {
          endpoint: getEndpoint(url),
          state: getCurrentState(),
          version: CLIENT_VERSION,
        });
      } catch {
        // no op
      }
      queue.unshift(backOff(call));
      attemptImmediate();
    } else if (
      [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT].includes(err.status) &&
      call.ttl > 0
    ) {
      call.ttl -= 1;
      queue.unshift(call);
      attemptImmediate();
    } else {
      recordQueueTime({ status: err.status }, call.queuedAt, ...call.args);
      call.reject(err);
    }
  }
}

function backOff(call) {
  call.ttl -= 1;
  const attempt = DEFAULT_TTL - call.ttl;
  call.wait = Math.random() * Math.pow(2, attempt) * PERIOD;
  return call;
}

// the time sent here includes time needed to run the requestFn
// and the time it takes the JS runtime to have the resolve/reject
// handlers execute. Therefore, it is off from the times reported
// by the Network tab in your dev tools by a few milliseconds to
// tens of millisecond at worst (as per my limited testing).
function recordResponseTime({ status }, startTime, { url, method } = {}) {
  const duration = Date.now() - startTime;
  try {
    if (duration < REPORTING_TIMEOUT) {
      Telemetry.record('cma-response-time', duration, {
        endpoint: getEndpoint(url),
        status,
        method,
        version: CLIENT_VERSION,
      });
    }
  } catch {
    // no-op
  }
}

function recordQueueTime({ status }, queuedAt, { url, method } = {}) {
  const duration = Date.now() - queuedAt;
  try {
    if (duration < REPORTING_TIMEOUT) {
      Telemetry.record('cma-queue-time', duration, {
        endpoint: getEndpoint(url),
        status,
        method,
        version: CLIENT_VERSION,
      });
    }
  } catch {
    // no-op
  }
}
