'use strict';

describe('data/spaceEndpoint', function () {
  beforeEach(function () {
    module('contentful/test');

    const authToken = this.$inject('authentication/token');
    authToken.get = sinon.stub().returns('TOKEN');

    const spaceEndpoint = this.$inject('data/spaceEndpoint');
    const request = spaceEndpoint.create('//test.io', 'SPACE');
    this.makeRequest = function (...args) {
      const response = request(...args);
      this.$inject('$timeout').flush();
      return response;
    };

    this.$http = this.$inject('$httpBackend');
  });

  afterEach(function () {
    this.$http.verifyNoOutstandingExpectation();
    this.$http.verifyNoOutstandingRequest();
  });

  it('sends GET request relative to space resource', function () {
    const url = '//test.io/spaces/SPACE/foo/bar';
    const headers = {
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json, text/plain, */*'
    };
    this.$http.expectGET(url, headers).respond();
    this.makeRequest({
      method: 'GET',
      path: ['foo', 'bar']
    });
    this.$http.flush();
  });

  it('resolves the promise with response data', function () {
    const responseHandler = sinon.stub();
    this.$http.expectGET('//test.io/spaces/SPACE/foo/bar')
    .respond('DATA');
    this.makeRequest({
      method: 'GET',
      path: ['foo', 'bar']
    }).then(responseHandler);
    this.$http.flush();
    sinon.assert.calledWithExactly(responseHandler, 'DATA');
  });

  it('sends POST request without version header', function () {
    const url = '//test.io/spaces/SPACE/foo/bar';
    const headers = {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json, text/plain, */*'
    };
    const data = {foo: 42};
    this.$http.expectPOST(url, JSON.stringify(data), headers).respond();
    this.makeRequest({
      method: 'POST',
      path: ['foo', 'bar'],
      data: data
    });
    this.$http.flush();
  });

  it('sends POST request with version header', function () {
    const url = '//test.io/spaces/SPACE/foo/bar';
    const headers = {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json, text/plain, */*',
      'X-Contentful-Version': 3
    };
    const data = {foo: 42};
    this.$http.expectPOST(url, JSON.stringify(data), headers).respond();
    this.makeRequest({
      method: 'POST',
      path: ['foo', 'bar'],
      data: data,
      version: 3
    });
    this.$http.flush();
  });

  describe('error response', function () {

    it('is an error object', function* () {
      this.$http.whenGET(/./).respond(500);
      const req = this.makeRequest({
        method: 'GET',
        path: ['foo']
      });
      this.$http.flush();
      const error = yield this.catchPromise(req);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toEqual('API request failed');
    });

    it('has "request" object', function* () {
      this.$http.whenGET(/./).respond(500);
      const req = this.makeRequest({
        method: 'GET',
        path: ['foo']
      });
      this.$http.flush();
      const error = yield this.catchPromise(req);
      expect(error.request.method).toBe('GET');
      expect(error.request.url).toBe('//test.io/spaces/SPACE/foo');
    });

    it('shadows Authorization header in request', function* () {
      this.$http.whenGET(/./).respond(500);
      const req = this.makeRequest({
        method: 'GET',
        path: ['foo']
      });
      this.$http.flush();
      const error = yield this.catchPromise(req);
      expect(error.request.headers['Authorization']).toBe('[REDACTED]');
    });

    it('has "response" properties', function* () {
      this.$http.whenGET(/./).respond(455, 'ERRORS');
      const req = this.makeRequest({
        method: 'GET',
        path: ['foo']
      });
      this.$http.flush();
      const error = yield this.catchPromise(req);
      expect(error.status).toBe(455);
      expect(error.data).toEqual('ERRORS');
    });
  });
});
