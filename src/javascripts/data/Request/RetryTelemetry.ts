import * as Telemetry from 'i13n/Telemetry';
import { getCurrentState, getEndpoint } from './Utils';
import { DEFAULT_TTL } from './RetryConstants';
import { RequestConfig } from 'data/Request';

const REPORTING_TIMEOUT = 60 * 1000;

/**
 * @description
 * the time sent here includes time needed to run the requestFn
 * and the time it takes the JS runtime to have the resolve/reject
 * handlers execute. Therefore, it is off from the times reported
 * by the Network tab in your dev tools by a few milliseconds to
 * tens of millisecond at worst (as per my limited testing).
 */
export function recordResponseTime(
  { status },
  startTime: number,
  version: number,
  client: string,
  config: RequestConfig
) {
  const url = config?.url;
  const method = config?.method;
  const duration = Date.now() - startTime;
  try {
    if (duration < REPORTING_TIMEOUT) {
      Telemetry.record('cma-response-time', duration, {
        endpoint: url ? getEndpoint(url) : 'unknown',
        status,
        method,
        version,
        client,
      });
    }
  } catch {
    // no-op
  }
}

export function recordQueueTime(
  { status },
  queuedAt: number,
  version: number,
  ttl: number,
  client: string,
  config: RequestConfig
) {
  const url = config?.url;
  const method = config?.method;
  const duration = Date.now() - queuedAt;
  try {
    if (duration < REPORTING_TIMEOUT) {
      Telemetry.record('cma-queue-time', duration, {
        endpoint: url ? getEndpoint(url) : 'unknown',
        status,
        method,
        version,
        retries: DEFAULT_TTL - ttl,
        client,
      });
    }
  } catch {
    // no-op
  }
}

export function recordRateLimitExceeded(version: number, url: string, ttl: number, client: string) {
  try {
    Telemetry.count('cma-rate-limit-exceeded', {
      endpoint: getEndpoint(url),
      state: getCurrentState(),
      version,
      retries: DEFAULT_TTL - ttl,
      client,
    });
  } catch {
    // no-op
  }
}
