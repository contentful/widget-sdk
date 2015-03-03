'use strict';

describe('Promised loader service', function () {
  var loader, stubs, $rootScope, $q;
  var host;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'method', 'success', 'error', 'success2', 'error2'
      ]);
    });
    inject(function ($injector) {
      var PromisedLoader        = $injector.get('PromisedLoader');
      var delayedInvocationStub = $injector.get('delayedInvocationStub');
      $rootScope                = $injector.get('$rootScope');
      $q                        = $injector.get('$q');
      loader = new PromisedLoader();
      sinon.stub(loader, '_loadPromise', delayedInvocationStub(loader._loadPromise));

      host = {
        methodName: stubs.method
      };
    });
  });

  describe('load entities successfully', function() {
    beforeEach(function() {
      stubs.method.returns($q.when({}));
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      $rootScope.$apply();
    });

    it('calls host method', function() {
      expect(stubs.method).toBeCalled();
    });

    it('calls success callback', function() {
      expect(stubs.success).toBeCalled();
    });

    it('does not call error callback', function() {
      sinon.assert.notCalled(stubs.error);
    });

    it('loader is not in progress at the end', function() {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  describe('load entities with a server error', function() {
    beforeEach(function() {
      stubs.method.returns($q.reject({}));
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      $rootScope.$apply();
    });

    it('calls method', function() {
      expect(stubs.method).toBeCalled();
    });

    it('does not call success callback', function() {
      sinon.assert.notCalled(stubs.success);
    });

    it('calls error callback', function() {
      expect(stubs.error).toBeCalled();
    });

    it('loader is not in progress at the end', function() {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  it('loader in progress', function() {
    stubs.method.returns($q.defer().promise);
    loader.loadPromise(stubs.method);
    $rootScope.$apply();
    loader._loadPromise.invokeDelayed();
    expect(loader.inProgress).toBeTruthy();
  });

  describe('attempt to load more than once simultaneously', function() {
    beforeEach(function() {
      this.first  = $q.defer();
      this.second = $q.defer();
      stubs.method
        .onCall(0).returns(this.first.promise)
        .onCall(1).returns(this.second.promise);
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      loader.loadPromise(stubs.method).then(stubs.success2, stubs.error2);
      this.first.resolve({});
      $rootScope.$digest();
    });

    it('calls method', function() {
      expect(stubs.method).toBeCalledOnce();
    });

    it('calls success callback', function() {
      expect(stubs.success).toBeCalled();
    });

    it('does not call error callback', function() {
      sinon.assert.notCalled(stubs.error);
    });

    it('does not call second success callback', function() {
      sinon.assert.notCalled(stubs.success2);
    });

    it('calls second error callback', function() {
      expect(stubs.error2).toBeCalled();
    });

  });

});

describe('PromisedLoader service', function () {
  var a,b;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('debounce', _.debounce);
    });
    inject(function (PromisedLoader) {
      a = new PromisedLoader();
      b = new PromisedLoader();
    });
  });

  it('The debounced function in two Promised Loaders should be distinct', function () {
    expect(a._loadPromise).not.toBe(b._loadPromise);
  });

});
