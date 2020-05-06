import _ from 'lodash';
import client from './client';
import makeRequest from 'data/Request';

jest.mock('data/Request', () => jest.fn());

describe('Client', () => {
  describe('#request', () => {
    let baseRequest;

    beforeEach(() => {
      baseRequest = jest.fn().mockResolvedValue('RESPONSE DATA');

      makeRequest.mockReturnValue(baseRequest);
    });

    it('constructs a path, strips extra slashes', async function () {
      await client.request({ path: '/some/path' });
      await client.request({ path: 'path/2' });

      expect(baseRequest).toHaveBeenCalledTimes(2);
      expect(baseRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ url: '//api.test.com/some/path' })
      );
      expect(baseRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ url: '//api.test.com/path/2' })
      );
    });

    it('passes through the method', async function () {
      await client.request({ method: 'GET', path: '' });
      await client.request({ method: 'POST', path: '' });

      expect(baseRequest).toHaveBeenCalledTimes(2);

      expect(baseRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET' }));
      expect(baseRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'POST' }));
    });

    it('uses "query" for GET payload', async function () {
      await client.request({ method: 'GET', path: '', payload: 'TEST' });

      expect(baseRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ method: 'GET', query: 'TEST' })
      );
    });

    it('uses "body" for any other payload', async function () {
      await client.request({ method: 'POST', path: '', payload: 'TEST1' });
      await client.request({ method: 'PUT', path: '', payload: 'TEST2' });

      expect(baseRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ method: 'POST', body: 'TEST1' })
      );
      expect(baseRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ method: 'PUT', body: 'TEST2' })
      );
    });

    it('resolves with response data', async function () {
      const res = await client.request({ path: '' });

      expect(res).toBe('RESPONSE DATA');
    });

    it('rejects with status code, data and request for errors', async function () {
      baseRequest.mockRejectedValue({ status: '777', data: 'OMG ERROR' });

      let err;

      try {
        await client.request({ path: 'error' });
      } catch (e) {
        err = e;
      }

      expect(err.statusCode).toBe(777);
      expect(err.body).toBe('OMG ERROR');
      expect(err.request.url).toBe('//api.test.com/error');
    });
  });
});
