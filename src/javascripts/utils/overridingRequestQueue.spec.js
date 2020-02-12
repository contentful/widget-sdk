import _ from 'lodash';
import { createRequestQueue } from './overridingRequestQueue';

describe('overridingRequestQueue', () => {
  it('handles single request', done => {
    const d = jest.fn().mockResolvedValue();
    const request = createRequestQueue(() => d());

    return request().then(() => {
      expect(d).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('checks if is idle', function() {
    const request = createRequestQueue(() => Promise.resolve());
    expect(request.isIdle()).toBe(true);
    request();
    expect(request.isIdle()).toBe(false);
  });

  it('resolves with a result of the last call', done => {
    let calls = 0;

    const requestFn = jest.fn().mockImplementation(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve('this result value will be lost');
      }
      return Promise.resolve(true);
    });

    const request = createRequestQueue(requestFn);
    const promise = request();
    request();

    return promise.then(result => {
      expect(result).toBe(true);
      expect(requestFn).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it('rejects if call ends up with an error', done => {
    let calls = 0;

    const requestFn = jest.fn().mockImplementation(() => {
      calls++;
      switch (calls) {
        case 1:
          return Promise.reject('boom');
        case 2:
          return Promise.reject('kaboom');
        default:
          return Promise.resolve(true);
      }
    });

    const request = createRequestQueue(requestFn);
    const promise = request();
    request();
    request();

    return promise.then(
      () => {
        throw new Error('Should not end up here, rejecting first!');
      },
      err => {
        expect(err).toBe('boom');
        expect(requestFn).toHaveBeenCalledTimes(3);
        done();
      }
    );
  });
});
