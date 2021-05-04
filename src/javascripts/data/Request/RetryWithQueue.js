import {
  ACCEPTED_STATUS,
  CALLS_IN_PERIOD,
  DEFAULT_TTL,
  RATE_LIMIT_EXCEEDED,
} from 'data/Request/RetryConstants';
import {
  recordQueueTime,
  recordRateLimitExceeded,
  recordResponseTime,
} from 'data/Request/RetryTelemetry';
import PQueue from 'p-queue';

const PERIOD = 1010;
const CLIENT_VERSION = 2;

export default function withRetry(requestFn, _, clientName) {
  const queue = new PQueue({ intervalCap: CALLS_IN_PERIOD, interval: PERIOD });

  return async function addToQueue(...args) {
    return doRequest({ args, ttl: DEFAULT_TTL, queuedAt: Date.now() });
  };

  async function doRequest(call, priority = 0) {
    const startTime = Date.now();
    try {
      const response = await queue.add(() => requestFn(...call.args), { priority });
      recordResponseTime({ status: 200 }, startTime, CLIENT_VERSION, clientName, ...call.args);
      recordQueueTime(
        { status: 200 },
        call.queuedAt,
        CLIENT_VERSION,
        call.ttl,
        clientName,
        ...call.args
      );
      return response;
    } catch (e) {
      recordResponseTime(e, startTime, CLIENT_VERSION, clientName, ...call.args);
      return handleError(call, e);
    }
  }

  async function reQueue(call) {
    return doRequest({ ...call, ttl: call.ttl - 1 }, 1);
  }

  async function handleError(call, error) {
    if (call.ttl > 0 && error.status === RATE_LIMIT_EXCEEDED) {
      recordRateLimitExceeded(CLIENT_VERSION, call.args[0]?.url, call.ttl, clientName);
    }
    if (call.ttl > 0 && ACCEPTED_STATUS.includes(error.status)) {
      return reQueue(call);
    } else {
      recordQueueTime(
        { status: error.status },
        call.queuedAt,
        CLIENT_VERSION,
        call.ttl,
        clientName,
        ...call.args
      );
      throw error;
    }
  }
}
