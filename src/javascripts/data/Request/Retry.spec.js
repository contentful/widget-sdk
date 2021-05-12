import withRetry from './Retry';
import withRetryQueue from './RetryWithQueue';

import { delay } from './Utils';
import * as Telemetry from 'i13n/Telemetry';

jest.mock('./Utils', () => ({
  delay: jest.fn(async () => {}),
  getEndpoint: jest.fn((url) => url),
  getCurrentState: jest.fn(() => 'STATE'),
}));

const requestFn = jest.fn().mockResolvedValue({});

let wrappedFn;

// executes all tasks and micro-tasks (timeouts and promise callbacks)
// but won't execute newly scheduled micro-tasks (promise callbacks)
async function flush() {
  jest.runOnlyPendingTimers();
  return Promise.resolve();
}

describe.each([
  { retryFn: withRetry, version: 1 },
  { retryFn: withRetryQueue, version: 2 },
])('Retry %j', ({ retryFn, version }) => {
  beforeEach(() => {
    requestFn.mockReset();
    jest.useFakeTimers();
    wrappedFn = retryFn(version);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('executes a request', async () => {
    requestFn.mockResolvedValueOnce('bar');
    const response = await wrappedFn('foo', requestFn);

    expect(requestFn).toHaveBeenCalledWith('foo');
    expect(response).toBe('bar');
  });

  it('consumes requests in a specific rate (7 per second)', async () => {
    Array(15)
      .fill()
      .forEach(() => wrappedFn(null, requestFn));

    // immediately calls 7
    await Promise.resolve();
    expect(requestFn).toHaveBeenCalledTimes(7);

    // after 1 period, calls 7 more
    await flush();
    expect(requestFn).toHaveBeenCalledTimes(14);

    // after 1 period, calls the remaining one
    await flush();
    expect(requestFn).toHaveBeenCalledTimes(15);
  });

  it('retries 429s 5 times', async () => {
    const error = { status: 429 };
    requestFn.mockRejectedValue(error);

    let err;

    try {
      await wrappedFn('foo', requestFn);
    } catch (e) {
      err = e;
    }

    expect(requestFn).toHaveBeenCalledTimes(6); // original + 5 retries
    expect(err).toBe(error);
  });

  it('retries 502s 5 times', async () => {
    const error = { status: 502 };
    requestFn.mockRejectedValue(error);

    let err;

    try {
      await wrappedFn('foo', requestFn);
    } catch (e) {
      err = e;
    }

    expect(requestFn).toHaveBeenCalledTimes(6); // original + 5 retries
    expect(err).toBe(error);
  });

  it('resolves if the request is eventually successful', async () => {
    const error = { status: 502 };
    requestFn.mockRejectedValueOnce(error).mockResolvedValueOnce('success');

    const result = await wrappedFn(null, requestFn);

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual('success');
  });

  describe('telemetry', () => {
    it('tracks 429s', async () => {
      requestFn.mockRejectedValue({ status: 429 });

      await wrappedFn({ url: 'foo/bar' }, requestFn).catch(() => {});

      expect(Telemetry.count).toHaveBeenCalledTimes(5);
      expect(Telemetry.count).toHaveBeenLastCalledWith('cma-rate-limit-exceeded', {
        endpoint: 'foo/bar',
        state: 'STATE',
        retries: 4,
        version: version,
        client: undefined,
      });
    });

    it('tracks response time os successful calls', async () => {
      await wrappedFn({ url: 'bar/foo', method: 'POST' }, requestFn);

      expect(Telemetry.record).toHaveBeenCalledTimes(2);
      expect(Telemetry.record).toHaveBeenCalledWith('cma-response-time', expect.any(Number), {
        endpoint: 'bar/foo',
        status: 200,
        method: 'POST',
        version: version,
        client: undefined,
      });
    });

    it('tracks response time of rejected calls', async () => {
      requestFn.mockRejectedValue({ status: 404 });

      await wrappedFn({ url: 'foo/foo', method: 'DELETE' }, requestFn).catch(() => {});

      expect(Telemetry.record).toHaveBeenCalledTimes(2);
      expect(Telemetry.record).toHaveBeenCalledWith('cma-response-time', expect.any(Number), {
        endpoint: 'foo/foo',
        status: 404,
        method: 'DELETE',
        version: version,
        client: undefined,
      });
    });

    it('tracks queue time of successful calls', async () => {
      await wrappedFn({ url: 'bar/foo', method: 'POST' }, requestFn);

      expect(Telemetry.record).toHaveBeenCalledWith('cma-queue-time', expect.any(Number), {
        endpoint: 'bar/foo',
        status: 200,
        method: 'POST',
        version: version,
        retries: 0,
        client: undefined,
      });
    });

    it('tracks queue time of rejected calls', async () => {
      requestFn.mockRejectedValue({ status: 404 });

      await wrappedFn({ url: 'foo/foo', method: 'DELETE' }, requestFn).catch(() => {});

      expect(Telemetry.record).toHaveBeenCalledTimes(2);
      expect(Telemetry.record).toHaveBeenCalledWith('cma-queue-time', expect.any(Number), {
        endpoint: 'foo/foo',
        status: 404,
        method: 'DELETE',
        version: version,
        retries: 0,
        client: undefined,
      });
    });
  });
});

describe('Retry', () => {
  beforeEach(() => {
    requestFn.mockReset();
    jest.useFakeTimers();
    wrappedFn = withRetry();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('retries 429s after a delay', async () => {
    const error = { status: 429 };
    requestFn.mockRejectedValue(error);

    wrappedFn('foo', requestFn).catch(() => {});
    expect(requestFn).not.toHaveBeenCalled();
    expect(delay).toHaveBeenCalledTimes(1);
    await flush();
    expect(requestFn).toHaveBeenCalledTimes(1);
    await flush();
    expect(delay).toHaveBeenCalledTimes(2);
    expect(requestFn).toHaveBeenCalledTimes(2);
    await flush();
    expect(delay).toHaveBeenCalledTimes(3);
    expect(requestFn).toHaveBeenCalledTimes(3);
  });

  it('retries 429s with exponential backoff', async () => {
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
    const error = { status: 429 };
    requestFn.mockRejectedValue(error);

    let err;

    try {
      await wrappedFn('foo', requestFn);
    } catch (e) {
      err = e;
    }

    expect(err).toBe(error);
    expect(delay).toHaveBeenCalledTimes(6);

    expect(delay).toHaveBeenNthCalledWith(1, 0);
    expect(delay).toHaveBeenNthCalledWith(2, 2000);
    expect(delay).toHaveBeenNthCalledWith(3, 4000);
    expect(delay).toHaveBeenNthCalledWith(4, 8000);
    expect(delay).toHaveBeenNthCalledWith(5, 16000);
    expect(delay).toHaveBeenNthCalledWith(6, 32000);
  });
});
