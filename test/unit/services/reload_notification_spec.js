'use strict';

describe('ReloadNotification service', () => {
  let $q, $rootScope, ReloadNotification, open;
  beforeEach(module('contentful/test'));
  beforeEach(inject($injector => {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    ReloadNotification = $injector.get('ReloadNotification');
    open = sinon.stub($injector.get('modalDialog'), 'open');
    open.returns({ promise: $q.defer().promise });
    ReloadNotification.apiErrorHandler.restore();
  }));

  describe('the apiErrorHandler', () => {
    it('should trigger the api error for 500eds', () => {
      $q.reject({ statusCode: 500 }).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      sinon.assert.called(open);
    });

    it('should not trigger the api error for 502', () => {
      $q.reject({ statusCode: 502 }).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      sinon.assert.notCalled(open);
    });

    it('should not trigger the api error for < 500eds', () => {
      $q.reject({ statusCode: 404 }).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      sinon.assert.notCalled(open);
    });

    it('should not trigger the api error for errors without statusCode', () => {
      $q.reject({}).catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      sinon.assert.notCalled(open);
    });

    it('should not trigger the api error for errors that are Strings', () => {
      $q.reject('lolnope').catch(ReloadNotification.apiErrorHandler);
      $rootScope.$apply();
      sinon.assert.notCalled(open);
    });

    describe('should not interfere with further processing', () => {
      let successHandler, errorHandler, error;

      beforeEach(() => {
        successHandler = sinon.stub();
        errorHandler = sinon.stub();
        error = { statusCode: 500 };
      });

      function run(promise) {
        promise.catch(ReloadNotification.apiErrorHandler).then(successHandler, errorHandler);
        $rootScope.$apply();
      }

      it('when success', () => {
        run($q.resolve('derp'));
        sinon.assert.calledWith(successHandler, 'derp');
        sinon.assert.notCalled(errorHandler);
      });

      it('when handled error', () => {
        run($q.reject(error));
        sinon.assert.notCalled(successHandler);
        sinon.assert.calledWith(errorHandler, error);
      });

      it('when unhandled error', () => {
        error = {};
        run($q.reject(error));
        sinon.assert.notCalled(successHandler);
        sinon.assert.calledWith(errorHandler, error);
      });
    });
  });
});
