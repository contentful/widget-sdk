'use strict';

describe('Kaltura Client Wrapper', function () {
  let kalturaCredentialsDeferred, kalturaClientWrapper;
  let kalturaClientMock, KalturaErrorMessages, $q, $rootScope;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      $provide.value('kalturaCredentials', jasmine.createSpyObj('kalturaCredentialsStub', ['get']));
    });

    inject(function ($injector, $window) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');

      kalturaCredentialsDeferred = $q.defer();

      $injector.get('kalturaCredentials').get.and.returnValue(kalturaCredentialsDeferred.promise);

      kalturaClientMock = {baseEntry: jasmine.createSpyObj('baseEntrySpy', ['get', 'listAction'])};
      kalturaClientMock.baseEntry.get.and.returnValue($q.defer());
      $window.KalturaConfiguration = sinon.stub();
      $window.KalturaClient = jasmine.createSpy().and.returnValue(kalturaClientMock);

      KalturaErrorMessages = $injector.get('KalturaErrorMessages');
      kalturaClientWrapper = $injector.get('kalturaClientWrapper');
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('#_processResponseFromKalturaAPI', function () {
    function simulateCallToProcessResponseFromKalturaAPI (response) {
      const deferred = $q.defer();
      const promise = deferred.promise;

      kalturaClientWrapper._processResponseFromKalturaAPI(deferred, undefined, response);
      return promise;
    }

    describe('when the request fails', function () {
      let error;

      function failRequest (errorCode) {
        simulateCallToProcessResponseFromKalturaAPI({code: errorCode})
          .catch(function (_error_) { error = _error_; });

        $rootScope.$apply();
      }

      describe('because the entry id is invalid', function () {
        beforeEach(function () { failRequest('ENTRY_ID_NOT_FOUND'); });

        it('sets the message of the returned error to invalid entry message', function () {
          expect(error.message).toEqual(KalturaErrorMessages.invalidEntryId);
        });
      });

      describe('because the Kaltura Session is invalid or expired', function () {
        beforeEach(function () { failRequest('INVALID_KS'); });

        it('sets the message of the returned error to invalid or expired Kaltura Session', function () {
          expect(error.message).toEqual(KalturaErrorMessages.invalidKS);
        });
      });
    });

    describe('when the request succeeds', function () {
      let response;

      beforeEach(function () {
        simulateCallToProcessResponseFromKalturaAPI('response_from_kaltura')
          .then(function (_response_) { response = _response_; });

        $rootScope.$apply();
      });

      it('returns the response object from Kaltura', function () {
        expect(response).toEqual('response_from_kaltura');
      });
    });
  });

  describe('#entry', function () {
    describe('when the organizationId has been set', function () {
      beforeEach(function () {
        kalturaClientWrapper.setOrganizationId('org-123');
        kalturaClientWrapper.entry(1);
      });

      describe('when kaltura credentials are retrieved', function () {
        beforeEach(function () {
          kalturaCredentialsDeferred.resolve({});

          $rootScope.$apply();
        });
        it('uses Kaltura client to query for a particular entry', function () {
          expect(kalturaClientMock.baseEntry.get).toHaveBeenCalledWith(jasmine.any(Function), 1, null);
        });
      });
    });
  });

  describe('#list', function () {
    describe('when the organizationId has been set', function () {
      beforeEach(function () {
        kalturaClientWrapper.setOrganizationId('org-123');
        kalturaClientWrapper.list('filter', 'pager');
      });

      describe('when kaltura credentials are retrieved', function () {
        beforeEach(function () {
          kalturaCredentialsDeferred.resolve({});

          $rootScope.$apply();
        });
        it('uses Kaltura client to search for entries', function () {
          expect(kalturaClientMock.baseEntry.listAction).toHaveBeenCalledWith(jasmine.any(Function), 'filter', 'pager');
        });
      });
    });
  });
});
