'use strict';

describe('overridingRequestQueue', function () {
  beforeEach(function () {
    module('contentful/test');
    this.createQueue = this.$inject('overridingRequestQueue');
    this.$q = this.$inject('$q');
  });

  it('handles single request', function () {
    var d = sinon.stub().resolves();
    var request = this.createQueue(function () { return d(); });

    return request().then(function () {
      sinon.assert.calledOnce(d);
    });
  });

  it('checks if is idle', function () {
    var request = this.createQueue(_.constant(this.$q.resolve()));
    expect(request.isIdle()).toBe(true);
    request();
    expect(request.isIdle()).toBe(false);
    this.$apply();
    expect(request.isIdle()).toBe(true);
  });

  it('reuses promise for consecutive calls', function () {
    var d = sinon.stub().defers();
    var request = this.createQueue(function () { return d(); });
    var promise = request();

    expect(request()).toBe(promise);
    d.resolve();
    this.$apply();
    sinon.assert.calledTwice(d);
    expect(request()).not.toBe(promise);
  });

  it('resolves with a result of the last call', function () {
    var requestFn = sinon.stub();
    requestFn.onFirstCall().returns(this.$q.resolve('this result value will be lost'));
    requestFn.onSecondCall().returns(this.$q.resolve(true));

    var request = this.createQueue(requestFn);
    var promise = request(); request();

    return promise.then(function (result) {
      expect(result).toBe(true);
      sinon.assert.calledTwice(requestFn);
    });
  });

  it('rejects if call ends up with an error', function () {
    var requestFn = sinon.stub();
    requestFn.onFirstCall().returns(this.$q.reject('boom'));
    requestFn.onSecondCall().returns(this.$q.reject('kaboom'));
    requestFn.onThirdCall().returns(this.$q.resolve(true));

    var request = this.createQueue(requestFn);
    var promise = request(); request(); request();

    return promise.then(function () {
      throw new Error('Should not end up here, rejecting first!');
    }, function (err) {
      expect(err).toBe('boom');
      sinon.assert.calledThrice(requestFn);
    });
  });

  it('allows to define request as required', function () {
    var $timeout = this.$inject('$timeout');
    var spy = sinon.stub().resolves();
    var wasCalled = false;

    var request = this.createQueue(function () {
      if (wasCalled) {
        return spy('second call');
      } else {
        wasCalled = true;
        return $timeout(spy);
      }
    });

    var promise = request.hasToFinish();
    request();
    $timeout.flush();

    return promise.then(function () {
      sinon.assert.calledTwice(spy);
      sinon.assert.calledOnce(spy.withArgs('second call'));
    });
  });

  it('sets up one-time final actions', function () {
    var d = sinon.stub().resolves();
    var spy = sinon.spy();
    var request = this.createQueue(function () { return d(); }, spy);
    var promise = request();
    request();

    sinon.assert.calledTwice(d);
    sinon.assert.calledOnce(spy.withArgs(promise));
  });

  it('passes arguments from a call to a base function', function () {
    var spy = sinon.stub().resolves();
    var request = this.createQueue(spy);
    request('test', true);
    sinon.assert.calledOnce(spy.withArgs('test', true));
  });
});
