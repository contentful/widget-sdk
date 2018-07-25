'use strict';

describe('Contentful Client', () => {
  let $httpBackend, $rootScope;
  let client, successStub, failStub;

  beforeEach(() => {
    module('contentful/test');
    inject($injector => {

      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      const contentfulClient = $injector.get('contentfulClient');
      client = contentfulClient.newClient({
        host: 'api.contentful.com',
        space: 'spaceid',
        accessToken: 'access_token'
      });

      successStub = sinon.stub();
      failStub = sinon.stub();
    });
  });

  afterEach(inject($log => {
    $log.assertEmpty();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  function getUrl(path) {
    return 'https://api.contentful.com:443/spaces/spaceid'+path;
  }

  it('gets a space', () => {
    client.space().then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get a space', () => {
    client.space().then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets content types', () => {
    client.contentTypes().then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/content_types')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get content types', () => {
    client.contentTypes().then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/content_types')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets a content type', () => {
    client.contentType('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/content_types/123')).respond(200, {sys: {}, fields: []});
    $httpBackend.flush();
  });

  it('fails to get a content type', () => {
    client.contentType('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/content_types/123')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets entries', () => {
    client.entries().then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/entries')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get entries', () => {
    client.entries().then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/entries')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets an entry', () => {
    client.entry('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/entries/123')).respond(200, {sys: {}, fields: {}});
    $httpBackend.flush();
  });

  it('fails to get an entry', () => {
    client.entry('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/entries/123')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets assets', () => {
    client.assets().then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/assets')).respond(200, {});
    $httpBackend.flush();
  });

  it('fails to get assets', () => {
    client.assets().then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/assets')).respond(404, {});
    $httpBackend.flush();
  });

  it('gets an asset', () => {
    client.asset('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.called(successStub);
      sinon.assert.notCalled(failStub);
    });
    $httpBackend.expectGET(getUrl('/assets/123')).respond(200, {sys: {}, fields: {}});
    $httpBackend.flush();
  });

  it('fails to get an asset', () => {
    client.asset('123').then(successStub).catch(failStub).finally(() => {
      sinon.assert.notCalled(successStub);
      sinon.assert.called(failStub);
    });
    $httpBackend.expectGET(getUrl('/assets/123')).respond(404, {});
    $httpBackend.flush();
  });


});
