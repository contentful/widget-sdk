import * as Telemetry from 'i13n/Telemetry';
import { getEndpoint } from './Utils';
import PQueue from 'p-queue';
import { getCurrentState } from 'data/Request/Utils';

const RATE_LIMIT_EXCEEDED = 429;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

const PERIOD = 1010;
const CALLS_IN_PERIOD = 7;
const DEFAULT_TTL = 5;

const REPORTING_TIMEOUT = 60 * 1000;
/*
  To better differentiate clients sending events we can manually
  increment this version number if needed.
*/
const CLIENT_VERSION = 2;

export default function withRetry(requestFn, callsInPeriod = CALLS_IN_PERIOD) {
  const queue = new PQueue({ intervalCap: callsInPeriod, interval: PERIOD });

  return async function addToQueue(...args) {
    return doRequest({ args, ttl: DEFAULT_TTL, queuedAt: Date.now() });
  };

  async function doRequest(call, priority = 0) {
    const startTime = Date.now();
    try {
      const response = await queue.add(() => requestFn(...call.args), { priority });
      recordResponseTime({ status: 200 }, startTime, ...call.args);
      recordQueueTime({ status: 200 }, call.queuedAt, ...call.args);
      return response;
    } catch (e) {
      recordResponseTime(e, startTime, ...call.args);
      return handleError(call, e);
    }
  }

  async function reQueue(call) {
    return doRequest({ ...call, ttl: call.ttl - 1 }, 1);
  }

  async function handleError(call, error) {
    if (call.ttl <= 0) {
      recordQueueTime({ status: error.status }, call.queuedAt, ...call.args);
      throw error;
    }
    if (error.status === RATE_LIMIT_EXCEEDED) {
      trackRateLimitExceeded(call);
    }
    if (
      [RATE_LIMIT_EXCEEDED, BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT].includes(
        error.status
      )
    ) {
      return reQueue(call);
    } else {
      recordQueueTime({ status: error.status }, call.queuedAt, ...call.args);
      throw error;
    }
  }

  function trackRateLimitExceeded(call) {
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
}
