import sinon from 'sinon';
import _ from 'lodash';
import { $initialize, $inject } from 'test/helpers/helpers';
import { it } from 'test/helpers/dsl';

describe('Client', () => {
  beforeEach(async function() {
    this.baseRequest = sinon.stub();

    this.system.set('data/Request.es6', {
      default: sinon.stub().returns(this.baseRequest)
    });

    await $initialize(this.system);

    this.baseRequest.resolves({ data: 'RESPONSE DATA' });

    this.client = $inject('client');
    this.call = function(i) {
      return this.baseRequest.args[i][0];
    };
  });

  describe('#request', () => {
    it('constructs a path, strips extra slashes', async function() {
      await this.client.request({ path: '/some/path' });
      await this.client.request({ path: 'path/2' });
      sinon.assert.calledTwice(this.baseRequest);
      expect(this.call(0).url).toBe('//api.test.com/some/path');
      expect(this.call(1).url).toBe('//api.test.com/path/2');
    });

    it('passes through the method', async function() {
      await this.client.request({ method: 'GET', path: '' });
      await this.client.request({ method: 'POST', path: '' });
      sinon.assert.calledTwice(this.baseRequest);
      expect(this.call(0).method).toBe('GET');
      expect(this.call(1).method).toBe('POST');
    });

    it('uses "params" for GET payload', async function() {
      await this.client.request({ method: 'GET', path: '', payload: 'TEST' });
      expect(this.call(0).params).toBe('TEST');
    });

    it('uses "data" for any other payload', async function() {
      await this.client.request({ method: 'POST', path: '', payload: 'TEST1' });
      await this.client.request({ method: 'PUT', path: '', payload: 'TEST2' });
      expect(this.call(0).data).toBe('TEST1');
      expect(this.call(1).data).toBe('TEST2');
    });

    it('resolves with response data', async function() {
      const res = await this.client.request({ path: '' });

      expect(res).toBe('RESPONSE DATA');
    });

    it('rejects with status code, data and request for errors', async function() {
      this.baseRequest.rejects({ status: '777', data: 'OMG ERROR' });

      let err;

      try {
        await this.client.request({ path: 'error' });
      } catch (e) {
        err = e;
      }

      expect(err.statusCode).toBe(777);
      expect(err.body).toBe('OMG ERROR');
      expect(err.request.url).toBe('//api.test.com/error');
    });
  });
});
