import { assign } from 'utils/Collections';

describe('data/Endpoint', function () {
  const baseUrl = '//test.io';

  // These headers are set by `$http` by default
  const defaultHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'If-Modified-Since': '0',
    'Cache-Control': 'no-cache'
  };

  beforeEach(function () {
    module('contentful/test');

    const auth = {
      getToken: sinon.stub().resolves('TOKEN')
    };

    this.Endpoint = this.$inject('data/Endpoint');
    this.$http = this.$inject('$httpBackend');
    this.$timeout = this.$inject('$timeout');

    this.makeRequest = function (...args) {
      const request = this.Endpoint.create(baseUrl, auth);
      const response = request(...args);
      this.$inject('$timeout').flush();
      return response;
    };
  });

  afterEach(function () {
    this.$http.verifyNoOutstandingExpectation();
    this.$http.verifyNoOutstandingRequest();
    this.Endpoint = null;
  });


  it('sends GET request relative to resource', function () {
    const url = `${baseUrl}/foo/bar`;
    const headers = assign(defaultHeaders, {
      'Authorization': 'Bearer TOKEN'
    });

    this.$http.expectGET(url, headers).respond();
    this.makeRequest({
      method: 'GET',
      path: ['foo', 'bar']
    });
    this.$http.flush();
  });

  it('resolves the promise with response data', function () {
    const responseHandler = sinon.stub();
    this.$http.expectGET(`${baseUrl}/foo/bar`)
      .respond('DATA');
    this.makeRequest({
      method: 'GET',
      path: ['foo', 'bar']
    }).then(responseHandler);
    this.$http.flush();
    sinon.assert.calledWithExactly(responseHandler, 'DATA');
  });

  it('sends POST request without version header', function () {
    const url = `${baseUrl}/foo/bar`;
    const headers = assign(defaultHeaders, {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN'
    });
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
    const url = `${baseUrl}/foo/bar`;
    const headers = assign(defaultHeaders, {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN',
      'X-Contentful-Version': 3
    });
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
      expect(error.request.url).toBe(`${baseUrl}/foo`);
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

  describeCreateEndpoint('createSpaceEndpoint', 'spaces');
  describeCreateEndpoint('createOrganizationEndpoint', 'organizations');

  function describeCreateEndpoint (methodName, endpointUrl) {
    describe(`.${methodName}()`, function () {
      beforeEach(function () {
        this.auth = {
          getToken: sinon.stub().resolves('TOKEN')
        };
        this.headers = assign(defaultHeaders, {
          'Authorization': 'Bearer TOKEN',
          'Accept': 'application/json, text/plain, */*'
        });
        this.expectGetRequest = function (baseUrl, resourceId, path, expectedUrl) {
          this.$http.expectGET(expectedUrl, this.headers).respond();
          const spaceEndpoint = this.Endpoint[methodName](baseUrl, resourceId, this.auth);
          spaceEndpoint({
            method: 'GET',
            path: path
          });
          this.$timeout.flush();
          this.$http.flush();
        };
      });

      it(`sends request relative to ${endpointUrl} resource`, function () {
        this.expectGetRequest('//test.io', 'ID', ['foo', 'bar'], `//test.io/${endpointUrl}/ID/foo/bar`);
      });

      it('doesn\'t add extra slashes to url', function () {
        this.expectGetRequest('//test.io/', 'ID', ['/foo/', '/bar/'], `//test.io/${endpointUrl}/ID/foo/bar/`);
      });
    });
  }
});
