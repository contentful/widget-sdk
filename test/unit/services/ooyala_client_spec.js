'use strict';

describe('Ooyala Client', function () {
  let baseUrl, client, clientDeferred, ooyalaClient;
  let OoyalaErrorMessages, clientPromise;
  let $rootScope;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      client = {request: jasmine.createSpy()};
      $provide.value('client', client);
    });

    inject(function ($injector, $q) {
      $rootScope = $injector.get('$rootScope');
      ooyalaClient = $injector.get('ooyalaClient');
      OoyalaErrorMessages = $injector.get('OoyalaErrorMessages');

      clientDeferred = $q.defer();
      clientPromise = clientDeferred.promise;

      client.request.and.returnValue(clientPromise);
    });

    baseUrl = '/integrations/ooyala';
  });

  describe('#request', function () {
    describe('when the organization id has been set', function () {
      beforeEach(function () {
        ooyalaClient.setOrganizationId('ORG-ID');
        ooyalaClient.request('POST', baseUrl + '/v2/players', 'random stuff');
      });

      it('uses the client to execute a API request', function () {
        expect(client.request).toHaveBeenCalledWith({
          method: 'POST',
          path: '/integrations/ooyala/v2/players',
          payload: 'random stuff',
          headers: { 'X-Contentful-Organization': 'ORG-ID' }
        });
      });
    });

    describe('when the request fails', function () {
      let error;

      function failedRequest (response) {
        beforeEach(function () {
          ooyalaClient.setOrganizationId('ORG-ID');
          ooyalaClient.request('bla', 'bla', 'bla').catch(function (_error_) { error = _error_; });
          clientDeferred.reject(response);
          $rootScope.$apply();
        });
      }

      describe('because the user has no ooyala credentials', function () {
        const response = {statusCode: 403, body: { message: 'Missing credentials' }};

        failedRequest(response);

        it('sets the message property of the error to the missing credentials message', function () {
          expect(error.message).toBe(OoyalaErrorMessages.missingCredentials);
        });

        it('sets the response property of the error to the returned response', function () {
          expect(error.response).toBe(response);
        });
      });

      describe('because the specified asset cannot be found', function () {
        const response = {statusCode: 404};

        failedRequest(response);

        it('sets the message property of the error to the missing credentials message', function () {
          expect(error.message).toBe(OoyalaErrorMessages.invalidAssetID);
        });

        it('sets the response property of the error to the returned response', function () {
          expect(error.response).toBe(response);
        });
      });

      describe('because of an unknown error', function () {
        const response = {statusCode: 500};

        failedRequest(response);

        it('sets the message property of the error to the unknown error message', function () {
          expect(error.message).toBe(OoyalaErrorMessages.unknownError);
        });

        it('sets the response property of the error to the returned response', function () {
          expect(error.response).toBe(response);
        });
      });
    });
  });

  describe('helper methods', function () {
    function callHelperMethod (methodName, arg) {
      beforeEach(function () {
        spyOn(ooyalaClient, 'request').and.callThrough();
        ooyalaClient.setOrganizationId('ORG-ID');
        ooyalaClient[methodName](arg);
      });
    }

    describe('#assets', function () {
      callHelperMethod('assets', 'query');

      it('calls the #request method using the assets path and the parameter as a querystring', function () {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/v2/assets?query');
      });
    });

    describe('#raw', function () {
      callHelperMethod('raw', '/raw');

      it('calls the #request method using the paramater as the ooyala path', function () {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/raw');
      });
    });

    describe('#asset', function () {
      callHelperMethod('asset', 1);

      it('calls the #request method using the assets path and the asset id', function () {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/v2/assets/1');
      });
    });
  });
});
