'use strict';

describe('overridingRequestQueue', () => {
  beforeEach(function() {
    module('contentful/test');
    this.createQueue = this.$inject('overridingRequestQueue');
    this.$q = this.$inject('$q');
  });

  it('handles single request', function() {
    const d = sinon.stub().resolves();
    const request = this.createQueue(() => d());

    return request().then(() => {
      sinon.assert.calledOnce(d);
    });
  });

  it('checks if is idle', function() {
    const request = this.createQueue(_.constant(this.$q.resolve()));
    expect(request.isIdle()).toBe(true);
    request();
    expect(request.isIdle()).toBe(false);
    this.$apply();
    expect(request.isIdle()).toBe(true);
  });

  it('reuses promise for consecutive calls', function() {
    const d = sinon.stub().defers();
    const request = this.createQueue(() => d());
    const promise = request();

    expect(request()).toBe(promise);
    d.resolve();
    this.$apply();
    sinon.assert.calledTwice(d);
    expect(request()).not.toBe(promise);
  });

  it('resolves with a result of the last call', function() {
    const requestFn = sinon.stub();
    requestFn.onFirstCall().returns(this.$q.resolve('this result value will be lost'));
    requestFn.onSecondCall().returns(this.$q.resolve(true));

    const request = this.createQueue(requestFn);
    const promise = request();
    request();

    return promise.then(result => {
      expect(result).toBe(true);
      sinon.assert.calledTwice(requestFn);
    });
  });

  it('rejects if call ends up with an error', function() {
    const requestFn = sinon.stub();
    requestFn.onFirstCall().returns(this.$q.reject('boom'));
    requestFn.onSecondCall().returns(this.$q.reject('kaboom'));
    requestFn.onThirdCall().returns(this.$q.resolve(true));

    const request = this.createQueue(requestFn);
    const promise = request();
    request();
    request();

    return promise.then(
      () => {
        throw new Error('Should not end up here, rejecting first!');
      },
      err => {
        expect(err).toBe('boom');
        sinon.assert.calledThrice(requestFn);
      }
    );
  });

  it('allows to define request as required', function() {
    const $timeout = this.$inject('$timeout');
    const spy = sinon.stub().resolves();
    let wasCalled = false;

    const request = this.createQueue(() => {
      if (wasCalled) {
        return spy('second call');
      } else {
        wasCalled = true;
        return $timeout(spy);
      }
    });

    const promise = request.hasToFinish();
    request();
    $timeout.flush();

    return promise.then(() => {
      sinon.assert.calledTwice(spy);
      sinon.assert.calledOnce(spy.withArgs('second call'));
    });
  });

  it('sets up one-time final actions', function() {
    const d = sinon.stub().resolves();
    const spy = sinon.spy();
    const request = this.createQueue(() => d(), spy);
    const promise = request();
    request();

    sinon.assert.calledTwice(d);
    sinon.assert.calledOnce(spy.withArgs(promise));
  });

  it('passes arguments from a call to a base function', function() {
    const spy = sinon.stub().resolves();
    const request = this.createQueue(spy);
    request('test', true);
    sinon.assert.calledOnce(spy.withArgs('test', true));
  });
});
