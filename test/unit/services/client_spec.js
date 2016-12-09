'use strict';

describe('Client', function () {
  beforeEach(function () {
    const self = this;
    self.httpStub = sinon.stub();

    function passThrough (fn) {
      return function () {
        return fn.apply(null, arguments);
      };
    }

    module('contentful/test', function ($provide) {
      $provide.value('$http', self.httpStub);
      $provide.value('data/RequestQueue', {create: passThrough});
    });

    const env = this.$inject('environment');
    env.settings.api_host = 'api.contentful.com';

    this.client = this.$inject('client');
    this.init = function () {
      this.client.init('TOKEN');
      this.httpStub.resolves({data: 'RESPONSE DATA'});
    };
    this.call = function (i) {
      return this.httpStub.args[i][0];
    };
  });

  describe('#init', function () {
    it('fails on request if not initialized', function () {
      expect(this.client.request).toThrowError(/Call #init/);
    });

    it('sets headers and the base URL', function () {
      this.init();
      this.client.request({path: '/path'});

      sinon.assert.calledOnce(this.httpStub);
      const call = this.call(0);
      expect(call.url).toBe('//api.contentful.com/path');
      expect(call.headers).toEqual({
        Authorization: 'Bearer TOKEN',
        'X-Contentful-Skip-Transformation': true,
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      });
    });
  });

  describe('#request', function () {
    beforeEach(function () {
      this.init();
    });

    it('constructs a path, strips extra slashes', function () {
      this.client.request({path: '/some/path'});
      this.client.request({path: 'path/2'});
      sinon.assert.calledTwice(this.httpStub);
      expect(this.call(0).url).toBe('//api.contentful.com/some/path');
      expect(this.call(1).url).toBe('//api.contentful.com/path/2');
    });

    it('passes through the method', function () {
      this.client.request({method: 'GET', path: ''});
      this.client.request({method: 'POST', path: ''});
      sinon.assert.calledTwice(this.httpStub);
      expect(this.call(0).method).toBe('GET');
      expect(this.call(1).method).toBe('POST');
    });

    it('uses "params" for GET payload', function () {
      this.client.request({method: 'GET', path: '', payload: 'TEST'});
      expect(this.call(0).params).toBe('TEST');
    });

    it('uses "data" for any other payload', function () {
      this.client.request({method: 'POST', path: '', payload: 'TEST1'});
      this.client.request({method: 'PUT', path: '', payload: 'TEST2'});
      expect(this.call(0).data).toBe('TEST1');
      expect(this.call(1).data).toBe('TEST2');
    });

    pit('resolves with response data', function () {
      return this.client.request({path: ''}).then(function (res) {
        expect(res).toBe('RESPONSE DATA');
      });
    });

    pit('rejects with status code, data and request for errors', function () {
      this.httpStub.rejects({status: '777', data: 'OMG ERROR'});

      return this.client.request({path: 'error'}).then(_.noop, function (err) {
        expect(err.statusCode).toBe(777);
        expect(err.body).toBe('OMG ERROR');
        expect(err.request.url).toBe('//api.contentful.com/error');
      });
    });
  });
});
