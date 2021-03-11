import {
  BAD_GATEWAY,
  CALLS_IN_PERIOD,
  DEFAULT_TTL,
  GATEWAY_TIMEOUT,
  RATE_LIMIT_EXCEEDED,
  SERVICE_UNAVAILABLE,
} from 'data/Request/RetryConstants';
import {
  recordQueueTime,
  recordRateLimitExceeded,
  recordResponseTime,
} from 'data/Request/RetryTelemetry';
import { delay } from './Utils';

const PERIOD = 1000;
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
      recordResponseTime({ status: 200 }, startTime + call.wait, CLIENT_VERSION, ...call.args);
      recordQueueTime({ status: 200 }, call.queuedAt, CLIENT_VERSION, call.ttl, ...call.args);
      call.resolve(response);
    } catch (e) {
      handleError(call, e);
      recordResponseTime(e, startTime + call.wait, CLIENT_VERSION, ...call.args);
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
      recordRateLimitExceeded(CLIENT_VERSION, call.args[0]?.url, call.ttl);
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
      recordQueueTime(
        { status: err.status },
        call.queuedAt,
        CLIENT_VERSION,
        call.ttl,
        ...call.args
      );
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
