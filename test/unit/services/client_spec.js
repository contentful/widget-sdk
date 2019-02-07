'use strict';
import _ from 'lodash';

describe('Client', () => {
  beforeEach(function() {
    module('contentful/test');
    this.baseRequest = sinon.stub().resolves({ data: 'RESPONSE DATA' });
    this.mockService('data/Request.es6', {
      default: sinon.stub().returns(this.baseRequest)
    });

    this.client = this.$inject('client');
    this.call = function(i) {
      return this.baseRequest.args[i][0];
    };
  });

  describe('#request', () => {
    it('constructs a path, strips extra slashes', function() {
      this.client.request({ path: '/some/path' });
      this.client.request({ path: 'path/2' });
      sinon.assert.calledTwice(this.baseRequest);
      expect(this.call(0).url).toBe('//api.test.com/some/path');
      expect(this.call(1).url).toBe('//api.test.com/path/2');
    });

    it('passes through the method', function() {
      this.client.request({ method: 'GET', path: '' });
      this.client.request({ method: 'POST', path: '' });
      sinon.assert.calledTwice(this.baseRequest);
      expect(this.call(0).method).toBe('GET');
      expect(this.call(1).method).toBe('POST');
    });

    it('uses "params" for GET payload', function() {
      this.client.request({ method: 'GET', path: '', payload: 'TEST' });
      expect(this.call(0).params).toBe('TEST');
    });

    it('uses "data" for any other payload', function() {
      this.client.request({ method: 'POST', path: '', payload: 'TEST1' });
      this.client.request({ method: 'PUT', path: '', payload: 'TEST2' });
      expect(this.call(0).data).toBe('TEST1');
      expect(this.call(1).data).toBe('TEST2');
    });

    it('resolves with response data', function() {
      return this.client.request({ path: '' }).then(res => {
        expect(res).toBe('RESPONSE DATA');
      });
    });

    it('rejects with status code, data and request for errors', function() {
      this.baseRequest.rejects({ status: '777', data: 'OMG ERROR' });

      return this.client.request({ path: 'error' }).then(_.noop, err => {
        expect(err.statusCode).toBe(777);
        expect(err.body).toBe('OMG ERROR');
        expect(err.request.url).toBe('//api.test.com/error');
      });
    });
  });
});
