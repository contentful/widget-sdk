describe('data/Endpoint', function () {
  const baseUrl = '//test.io/';

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
    const url = `${baseUrl}/foo/bar`;
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

  describe('.createSpaceEndpoint()', function () {
    it('sends request relative to space resource', function () {
      const auth = {
        getToken: sinon.stub().resolves('TOKEN')
      };
      const headers = {
        'Authorization': 'Bearer TOKEN',
        'Accept': 'application/json, text/plain, */*'
      };

      this.$http.expectGET('//test.io/spaces/SPACE_ID/foo/bar', headers).respond();
      const spaceEndpoint = this.Endpoint.createSpaceEndpoint('//test.io', 'SPACE_ID', auth);
      spaceEndpoint({
        method: 'GET',
        path: ['foo', 'bar']
      });
      this.$timeout.flush();
      this.$http.flush();
    });
  });

  describe('.createOrganizationEndpoint()', function () {
    it('sends request relative to space resource', function () {
      const auth = {
        getToken: sinon.stub().resolves('TOKEN')
      };
      const headers = {
        'Authorization': 'Bearer TOKEN',
        'Accept': 'application/json, text/plain, */*'
      };

      this.$http.expectGET('//test.io/organizations/ORG_ID/foo/bar', headers).respond();
      const organizationEndpoint = this.Endpoint.createOrganizationEndpoint('//test.io', 'ORG_ID', auth);
      organizationEndpoint({
        method: 'GET',
        path: ['foo', 'bar']
      });
      this.$timeout.flush();
      this.$http.flush();
    });
  });
});
