import _ from 'lodash';
import client from './client.es6';
import makeRequest from 'data/Request.es6';

jest.mock('data/Request.es6', () => jest.fn(), { virtual: true });

describe('Client', () => {
  describe('#request', () => {
    let baseRequest;

    beforeEach(() => {
      baseRequest = jest.fn().mockResolvedValue({ data: 'RESPONSE DATA' });

      makeRequest.mockReturnValue(baseRequest);
    });

    it('constructs a path, strips extra slashes', async function() {
      await client.request({ path: '/some/path' });
      await client.request({ path: 'path/2' });

      expect(baseRequest).toHaveBeenCalledTimes(2);

      expect(baseRequest.mock.calls[0][0].url).toEqual('//api.test.com/some/path');
      expect(baseRequest.mock.calls[1][0].url).toEqual('//api.test.com/path/2');
    });

    it('passes through the method', async function() {
      await client.request({ method: 'GET', path: '' });
      await client.request({ method: 'POST', path: '' });

      expect(baseRequest).toHaveBeenCalledTimes(2);

      expect(baseRequest.mock.calls[0][0].method).toEqual('GET');
      expect(baseRequest.mock.calls[1][0].method).toEqual('POST');
    });

    it('uses "params" for GET payload', async function() {
      await client.request({ method: 'GET', path: '', payload: 'TEST' });

      expect(baseRequest.mock.calls[0][0].params).toEqual('TEST');
    });

    it('uses "data" for any other payload', async function() {
      await client.request({ method: 'POST', path: '', payload: 'TEST1' });
      await client.request({ method: 'PUT', path: '', payload: 'TEST2' });

      expect(baseRequest.mock.calls[0][0].data).toEqual('TEST1');
      expect(baseRequest.mock.calls[1][0].data).toEqual('TEST2');
    });

    it('resolves with response data', async function() {
      const res = await client.request({ path: '' });

      expect(res).toBe('RESPONSE DATA');
    });

    it('rejects with status code, data and request for errors', async function() {
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
