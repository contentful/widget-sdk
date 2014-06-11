'use strict';

describe('Promised loader service', function () {
  var loader, stubs, $rootScope;
  var host;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'method', 'success', 'error', 'success2', 'error2'
      ]);
    });
    inject(function (PromisedLoader, _$rootScope_, delayedInvocationStub) {
      $rootScope = _$rootScope_;
      loader = new PromisedLoader();
      sinon.stub(loader, '_loadCallback', delayedInvocationStub(loader._loadCallback));

      host = {
        methodName: stubs.method
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('load entities successfully', function() {
    beforeEach(function() {
      stubs.method.yields( null, {});
      loader.loadCallback(host, 'methodName', {}).then(stubs.success, stubs.error);
      loader._loadCallback.invokeDelayed();
    });

    it('calls host method', function() {
      expect(stubs.method).toBeCalled();
    });

    it('calls success callback', function() {
      expect(stubs.success).toBeCalled();
    });

    it('does not call error callback', function() {
      expect(stubs.error).not.toBeCalled();
    });

    it('loader is not in progress at the end', function() {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  describe('load entities with a server error', function() {
    beforeEach(function() {
      stubs.method.yields({});
      loader.loadCallback(host, 'methodName', {}).then(stubs.success, stubs.error);
      loader._loadCallback.invokeDelayed();
    });

    it('calls host method', function() {
      expect(stubs.method).toBeCalled();
    });

    it('does not call success callback', function() {
      expect(stubs.success).not.toBeCalled();
    });

    it('calls error callback', function() {
      expect(stubs.error).toBeCalled();
    });

    it('loader is not in progress at the end', function() {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  it('loader in progress', function() {
    loader.loadCallback(host, 'methodName', {}).then(stubs.success, stubs.error);
    loader._loadCallback.invokeDelayed();
    expect(loader.inProgress).toBeTruthy();
  });

  describe('attempt to load more than once simultaneously', function() {
    beforeEach(function() {
      loader.loadCallback(host, 'methodName', {}).then(stubs.success, stubs.error);
      loader._loadCallback.invokeDelayed();
      loader.loadCallback(host, 'methodName', {}).then(stubs.success2, stubs.error2);
      stubs.method.yield(null, {});
      $rootScope.$digest();
    });

    it('calls host method', function() {
      expect(stubs.method).toBeCalledOnce();
    });

    it('calls success callback', function() {
      expect(stubs.success).toBeCalled();
    });

    it('does not call error callback', function() {
      expect(stubs.error).not.toBeCalled();
    });

    it('does not call second success callback', function() {
      expect(stubs.success2).not.toBeCalled();
    });

    it('calls second error callback', function() {
      expect(stubs.error2).toBeCalled();
    });

  });

});
