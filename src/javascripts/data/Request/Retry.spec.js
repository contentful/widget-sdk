import withRetry from './Retry';
import { delay } from './Utils';

jest.useFakeTimers();

jest.mock('./Utils', () => ({
  delay: jest.fn(),
  getEndpoint: jest.fn(),
  getCurrentState: jest.fn(),
}));

const requestFn = jest.fn(() => Promise.resolve());
const wrappedFn = withRetry(requestFn);

// executes all tasks and micro-tasks (timeouts and promise callbacks)
// but won't execute newly scheduled micro-tasks (promise callbacks)
function flush() {
  jest.runOnlyPendingTimers();
}

// create n requests wrapped with Retry
const runTimes = (n = 1) => {
  Array(n)
    .fill()
    .forEach(() => wrappedFn());
};

describe('Retry', () => {
  it('executes a request', async () => {
    requestFn.mockResolvedValueOnce('bar');
    const response = await wrappedFn('foo');

    expect(requestFn).toHaveBeenCalledWith('foo');
    expect(response).toBe('bar');
  });

  it('consumes requests in a specific rate (7 per second)', async () => {
    runTimes(15);
    // immediately calls 7
    expect(requestFn).toHaveBeenCalledTimes(7);
    flush();
    // after 1 period, calls 7 more
    expect(requestFn).toHaveBeenCalledTimes(14);
    flush();
    // after 1 period, calls the remaining one
    expect(requestFn).toHaveBeenCalledTimes(15);
  });

  it('retries 429s 5 times', async () => {
    const error = { status: 429 };
    requestFn.mockRejectedValue(error);

    let err;

    try {
      await wrappedFn('foo');
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
      await wrappedFn('foo');
    } catch (e) {
      err = e;
    }

    expect(requestFn).toHaveBeenCalledTimes(6); // original + 5 retries
    expect(err).toBe(error);
  });

  it('resolves if the request is eventually successful', async () => {
    const error = { status: 502 };
    requestFn.mockRejectedValueOnce(error).mockResolvedValueOnce('success');

    const result = await wrappedFn();

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual('success');
  });

  it('retries 429s with exponential backoff', async () => {
    jest.spyOn(Math, 'random').mockImplementation(() => 1);
    const error = { status: 429 };
    requestFn.mockRejectedValue(error);

    await wrappedFn().catch(() => {});

    expect(delay).toHaveBeenCalledTimes(6);

    expect(delay).toHaveBeenNthCalledWith(1, 0);
    expect(delay).toHaveBeenNthCalledWith(2, 2000);
    expect(delay).toHaveBeenNthCalledWith(3, 4000);
    expect(delay).toHaveBeenNthCalledWith(4, 8000);
    expect(delay).toHaveBeenNthCalledWith(5, 16000);
    expect(delay).toHaveBeenNthCalledWith(6, 32000);
  });
});
