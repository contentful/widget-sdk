'use strict';

describe('ReloadNotification service', function () {
  var $q, $rootScope, ReloadNotification, open;
  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($injector){
    $q                 = $injector.get('$q');
    $rootScope         = $injector.get('$rootScope');
    ReloadNotification = $injector.get('ReloadNotification');
    open               = sinon.stub($injector.get('modalDialog'), 'open');
    open.returns({then: sinon.stub()});
    ReloadNotification.apiErrorHandler.restore();
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('trigger', function () {
    it('should not open the notification twice');
    it('should send the correct message');
    it('should default to the default message');
  });

  describe('the apiErrorHandler', function () {
    it('should trigger the api error for 500eds', function () {
      $q.reject({statusCode: 500}).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      expect(open).toBeCalled();
    });

    it('should not trigger the api error for 502', function () {
      $q.reject({statusCode: 502}).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      expect(open).not.toBeCalled();
    });

    it('should not trigger the api error for < 500eds', function () {
      $q.reject({statusCode: 404}).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      expect(open).not.toBeCalled();
    });

    it('should not trigger the api error for errors without statusCode', function () {
      $q.reject({}).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      expect(open).not.toBeCalled();
    });

    it('should not trigger the api error for errors that are Strings', function () {
      $q.reject('lolnope').catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      expect(open).not.toBeCalled();
    });

    describe('should not interfere with further processing', function () {
      var successHandler, errorHandler, error;

      beforeEach(function () {
        successHandler = sinon.stub();
        errorHandler   = sinon.stub();
        error          = {statusCode: 500};
      });

      function run(promise) {
        promise
        .catch(ReloadNotification.apiErrorHandler)
        .then(successHandler, errorHandler);
        $rootScope.$apply();
      }

      it('when success', function () {
        run($q.when('derp'));
        expect(successHandler).toBeCalledWith('derp');
        expect(errorHandler).not.toBeCalled();
      });

      it('when handled error', function () {
        run($q.reject(error));
        expect(successHandler).not.toBeCalled();
        expect(errorHandler).toBeCalledWith(error);
      });

      it('when unhandled error', function () {
        error = {};
        run($q.reject(error));
        expect(successHandler).not.toBeCalled();
        expect(errorHandler).toBeCalledWith(error);
      });
    });

  });
});
