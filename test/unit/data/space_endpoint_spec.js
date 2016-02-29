'use strict';

describe('data/spaceEndpoint', function () {
  beforeEach(function () {
    module('cf.data', 'ngMock');
    var spaceEndpoint = this.$inject('data/spaceEndpoint');
    this.makeRequest = spaceEndpoint.create('TOKEN', '//test.io', 'SPACE');
    this.$http = this.$inject('$httpBackend');
  });

  afterEach(function() {
    this.$http.verifyNoOutstandingExpectation();
    this.$http.verifyNoOutstandingRequest();
  });

  it('sends GET request relative to space resource', function () {
    var url = '//test.io/spaces/SPACE/foo/bar';
    var headers = {
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
    var responseHandler = sinon.stub();
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
    var url = '//test.io/spaces/SPACE/foo/bar';
    var headers = {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json, text/plain, */*'
    };
    var data = {foo: 42};
    this.$http.expectPOST(url, JSON.stringify(data), headers).respond();
    this.makeRequest({
      method: 'POST',
      path: ['foo', 'bar'],
      data: data
    });
    this.$http.flush();
  });

  it('sends POST request with version header', function () {
    var url = '//test.io/spaces/SPACE/foo/bar';
    var headers = {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json, text/plain, */*',
      'X-Contentful-Version': 3
    };
    var data = {foo: 42};
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

    it('is an error object', function (done) {
      this.$http.whenGET(/./).respond(500);
      this.makeRequest({
        method: 'GET',
        path: ['foo'],
      }).catch(function (error) {
        expect(error instanceof Error).toBe(true);
        expect(error.message).toEqual('API request failed');
        _.defer(done);
      });
      this.$http.flush();
    });

    it('has "request" object', function (done) {
      this.$http.whenGET(/./).respond(500);
      this.makeRequest({
        method: 'GET',
        path: ['foo'],
      }).catch(function (error) {
        expect(error.request.method).toBe('GET');
        expect(error.request.url).toBe('//test.io/spaces/SPACE/foo');
        _.defer(done);
      });
      this.$http.flush();
    });

    it('shadows Authorization header in request', function (done) {
      this.$http.whenGET(/./).respond(500);
      this.makeRequest({
        method: 'GET',
        path: ['foo'],
      }).catch(function (error) {
        expect(error.request.headers['Authorization']).toBe('[REDACTED]');
        _.defer(done);
      });
      this.$http.flush();
    });

    it('has "response" properties', function (done) {
      this.$http.whenGET(/./).respond(455, 'ERRORS');
      this.makeRequest({
        method: 'GET',
        path: ['foo'],
      }).catch(function (error) {
        expect(error.status).toBe(455);
        expect(error.data).toEqual('ERRORS');
        _.defer(done);
      });
      this.$http.flush();
    });
  });
});
