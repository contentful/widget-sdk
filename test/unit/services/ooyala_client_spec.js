'use strict';

describe('Ooyala Client', function () {
  var baseUrl, clientAdapter, clientAdapterDeferred, ooyalaClient, OoyalaErrorMessages, clientAdapterPromise,
      $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      clientAdapter = {request: jasmine.createSpy()};
      $provide.value('clientAdapter', clientAdapter);
    });

    inject(function($injector, $q){
      $rootScope            = $injector.get('$rootScope');
      ooyalaClient          = $injector.get('ooyalaClient');
      OoyalaErrorMessages   = $injector.get('OoyalaErrorMessages');

      clientAdapterDeferred = $q.defer();
      clientAdapterPromise  = clientAdapterDeferred.promise;

      clientAdapter.request.and.returnValue(clientAdapterPromise);
    });

    baseUrl =  '/integrations/ooyala';
  });

  describe('#request', function() {
    describe('when no organization id has been set', function() {
      it('raises an exception', function() {
        var request = function(){
          ooyalaClient.request('bla', 'ble', 'bli');
        };

        expect(request).toThrow();
      });
    });

    describe('when the organization id has been set', function() {
      beforeEach(function() {
        ooyalaClient.setOrganizationId('ORG-ID');
        ooyalaClient.request('POST', baseUrl + '/v2/players', 'random stuff');
      });

      it('uses the client adapter to execute a API request', function() {
        expect(ooyalaClient.clientAdapter.request).toHaveBeenCalledWith({
          method   : 'POST',
          path     : '/integrations/ooyala/v2/players',
          payload  : 'random stuff',
          headers  : {'X-Contentful-Organization' : 'ORG-ID'}
        });
      });

    });

    describe('when the request fails', function() {
      var error;

      function failedRequest(response) {
        beforeEach(function() {
          ooyalaClient.setOrganizationId('ORG-ID');
          ooyalaClient.request('bla', 'bla', 'bla').catch(function(_error_){ error = _error_; });
          clientAdapterDeferred.reject(response);
          $rootScope.$apply();
        });
      }

      describe('because the user has no ooyala credentials', function() {
        var response = {statusCode: 403, body: { message: 'Missing credentials' }};

        failedRequest(response);

        it('sets the message property of the error to the missing credentials message', function() {
          expect(error.message).toBe(OoyalaErrorMessages.missingCredentials);
        });

        it('sets the response property of the error to the returned response', function() {
          expect(error.response).toBe(response);
        });
      });

      describe('because the specified asset cannot be found', function() {
        var response = {statusCode: 404};

        failedRequest(response);

        it('sets the message property of the error to the missing credentials message', function() {
          expect(error.message).toBe(OoyalaErrorMessages.invalidAssetID);
        });

        it('sets the response property of the error to the returned response', function() {
          expect(error.response).toBe(response);
        });
      });

      describe('because of an unknown error', function() {
        var response = {statusCode: 500};

        failedRequest(response);

        it('sets the message property of the error to the unknown error message', function() {
          expect(error.message).toBe(OoyalaErrorMessages.unknownError);
        });

        it('sets the response property of the error to the returned response', function() {
          expect(error.response).toBe(response);
        });
      });
    });

  });

  describe('helper methods', function() {
    function callHelperMethod(methodName, arg){
      beforeEach(function() {
        spyOn(ooyalaClient, 'request').and.callThrough();
        ooyalaClient.setOrganizationId('ORG-ID');
        ooyalaClient[methodName].call(ooyalaClient, arg);
      });
    }

    describe('#assets', function() {
      callHelperMethod('assets', 'query');

      it('calls the #request method using the assets path and the parameter as a querystring', function() {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/v2/assets?query');
      });
    });

    describe('#raw', function() {
      callHelperMethod('raw', '/raw');

      it('calls the #request method using the paramater as the ooyala path', function() {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/raw');
      });
    });

    describe('#asset', function() {
      callHelperMethod('asset', 1);

      it('calls the #request method using the assets path and the asset id', function() {
        expect(ooyalaClient.request).toHaveBeenCalledWith('GET', baseUrl + '/v2/assets/1');
      });
    });
  });

});
