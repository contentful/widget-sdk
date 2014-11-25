'use strict';

describe('Contentful Client', function () {
  var $httpBackend, $rootScope;
  var client, successStub, failStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($injector) {

      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      var contentfulClient = $injector.get('contentfulClient');
      client = contentfulClient.newClient({
        host: 'api.contentful.com',
        space: 'spaceid',
        accessToken: 'access_token'
      });

      successStub = sinon.stub();
      failStub = sinon.stub();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  function getUrl(path) {
    return 'https://api.contentful.com:443/spaces/spaceid'+path+'?access_token=access_token';
  }

  it('gets a space', function() {
    client.space().then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get a space', function() {
    client.space().then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets content types', function() {
    client.contentTypes().then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get content types', function() {
    client.contentTypes().then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets a content type', function() {
    client.contentType('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types/123')).respond(200, {sys: {}, fields: []});
    $httpBackend.flush();
  });

  it('fails to get a content type', function() {
    client.contentType('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types/123')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets an editing interface', function() {
    client.editingInterface('123', 'default').then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types/123/editor_interfaces/default')).respond(200, {sys: {}, fields: []});
    $httpBackend.flush();
  });

  it('fails to get an editing interface', function() {
    client.editingInterface('123', 'default').then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/content_types/123/editor_interfaces/default')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets entries', function() {
    client.entries().then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/entries')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get entries', function() {
    client.entries().then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/entries')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets an entry', function() {
    client.entry('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/entries/123')).respond(200, {sys: {}, fields: {}});
    $httpBackend.flush();
  });

  it('fails to get an entry', function() {
    client.entry('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/entries/123')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets assets', function() {
    client.assets().then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/assets')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get assets', function() {
    client.assets().then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/assets')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets an asset', function() {
    client.asset('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).toBeCalled();
      expect(failStub).not.toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/assets/123')).respond(200, {sys: {}, fields: {}});
    $httpBackend.flush();
  });

  it('fails to get an asset', function() {
    client.asset('123').then(successStub).catch(failStub).finally(function () {
      expect(successStub).not.toBeCalled();
      expect(failStub).toBeCalled();
    });
    $httpBackend.expectGET(getUrl('/assets/123')).respond(404, {});
    $httpBackend.flush();
  });


});
