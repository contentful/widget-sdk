import sinon from 'sinon';
import _ from 'lodash';
import { $initialize, $inject } from 'test/utils/ng';

describe('Promised loader service', () => {
  let loader, stubs, $rootScope, $q;

  beforeEach(async function () {
    stubs = {
      method: sinon.stub(),
      success: sinon.stub(),
      error: sinon.stub(),
      success2: sinon.stub(),
      error2: sinon.stub(),
    };

    const PromisedLoader = (
      await this.system.import('components/tabs/asset_list/services/PromisedLoader')
    ).PromisedLoader;

    await $initialize(this.system, ($provide) => {
      $provide.constant('lodash/debounce', _.debounce);
    });

    const delayedInvocationStub = $inject('delayedInvocationStub');
    $rootScope = $inject('$rootScope');
    $q = $inject('$q');
    loader = new PromisedLoader();
    loader._loadPromise = delayedInvocationStub(loader._loadPromise);
  });

  describe('load entities successfully', () => {
    beforeEach(() => {
      stubs.method.returns($q.resolve({}));
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      $rootScope.$apply();
    });

    it('calls host method', () => {
      sinon.assert.called(stubs.method);
    });

    it('calls success callback', () => {
      sinon.assert.called(stubs.success);
    });

    it('does not call error callback', () => {
      sinon.assert.notCalled(stubs.error);
    });

    it('loader is not in progress at the end', () => {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  describe('load entities with a server error', () => {
    beforeEach(() => {
      stubs.method.returns($q.reject({}));
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      $rootScope.$apply();
    });

    it('calls method', () => {
      sinon.assert.called(stubs.method);
    });

    it('does not call success callback', () => {
      sinon.assert.notCalled(stubs.success);
    });

    it('calls error callback', () => {
      sinon.assert.called(stubs.error);
    });

    it('loader is not in progress at the end', () => {
      expect(loader.inProgress).toBeFalsy();
    });
  });

  it('loader in progress', () => {
    stubs.method.returns($q.defer().promise);
    loader.loadPromise(stubs.method);
    $rootScope.$apply();
    loader._loadPromise.invokeDelayed();
    expect(loader.inProgress).toBeTruthy();
  });

  describe('attempt to load more than once simultaneously', () => {
    beforeEach(function () {
      this.first = $q.defer();
      this.second = $q.defer();
      stubs.method.onCall(0).returns(this.first.promise).onCall(1).returns(this.second.promise);
      loader.loadPromise(stubs.method).then(stubs.success, stubs.error);
      loader._loadPromise.invokeDelayed();
      loader.loadPromise(stubs.method).then(stubs.success2, stubs.error2);
      this.first.resolve({});
      $rootScope.$digest();
    });

    it('calls method', () => {
      sinon.assert.calledOnce(stubs.method);
    });

    it('calls success callback', () => {
      sinon.assert.called(stubs.success);
    });

    it('does not call error callback', () => {
      sinon.assert.notCalled(stubs.error);
    });

    it('does not call second success callback', () => {
      sinon.assert.notCalled(stubs.success2);
    });

    it('calls second error callback', () => {
      sinon.assert.called(stubs.error2);
    });
  });
});

describe('PromisedLoader service', () => {
  let a, b;
  beforeEach(async function () {
    const PromisedLoader = (
      await this.system.import('components/tabs/asset_list/services/PromisedLoader')
    ).PromisedLoader;

    await $initialize(this.system, ($provide) => {
      $provide.constant('lodash/debounce', _.debounce);
    });

    a = new PromisedLoader();
    b = new PromisedLoader();
  });

  it('The debounced function in two Promised Loaders should be distinct', () => {
    expect(a._loadPromise).not.toBe(b._loadPromise);
  });
});
