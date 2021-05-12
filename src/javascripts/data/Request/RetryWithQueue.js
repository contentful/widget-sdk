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

export default function withRetry() {
  const queue = new PQueue({ intervalCap: CALLS_IN_PERIOD, interval: PERIOD });

  return async function addToQueue(config, requestFn, clientName) {
    return doRequest({ requestFn, config, ttl: DEFAULT_TTL, queuedAt: Date.now(), clientName });
  };

  async function doRequest(call, priority = 0) {
    const startTime = Date.now();
    try {
      const response = await queue.add(() => call.requestFn(call.config), { priority });
      recordResponseTime({ status: 200 }, startTime, CLIENT_VERSION, call.clientName, call.config);
      recordQueueTime(
        { status: 200 },
        call.queuedAt,
        CLIENT_VERSION,
        call.ttl,
        call.clientName,
        call.config
      );
      return response;
    } catch (e) {
      recordResponseTime(e, startTime, CLIENT_VERSION, call.clientName, call.config);
      return handleError(call, e);
    }
  }

  async function reQueue(call) {
    return doRequest({ ...call, ttl: call.ttl - 1 }, 1);
  }

  async function handleError(call, error) {
    if (call.ttl > 0 && error.status === RATE_LIMIT_EXCEEDED) {
      recordRateLimitExceeded(CLIENT_VERSION, call.config?.url, call.ttl, call.clientName);
    }
    if (call.ttl > 0 && ACCEPTED_STATUS.includes(error.status)) {
      return reQueue(call);
    } else {
      recordQueueTime(
        { status: error.status },
        call.queuedAt,
        CLIENT_VERSION,
        call.ttl,
        call.clientName,
        call.config
      );
      throw error;
    }
  }
}
