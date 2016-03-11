'use strict';

describe('overridingRequestQueue', function () {
  beforeEach(function () {
    module('cf.utils');
    this.createQueue = this.$inject('overridingRequestQueue');
  });

  pit('handles single request', function () {
    var d = sinon.stub().resolves();
    var request = this.createQueue(function () { return d(); });

    return request().then(function () {
      sinon.assert.calledOnce(d);
    });
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

  pit('resolves with a result of the last call', function () {
    var d = sinon.stub().defers();
    var requestFn = sinon.spy(function () { return d(); });
    var request = this.createQueue(requestFn);
    var promise = request();

    request();

    d.resolve('this result value will be lost');
    d = sinon.stub().defers();
    this.$apply();

    d.resolve(true);
    this.$apply();

    return promise.then(function (result) {
      expect(result).toBe(true);
      sinon.assert.calledTwice(requestFn);
    });
  });

  it('sets up one-time final actions', function () {
    var d = sinon.stub().resolves();
    var spy = sinon.spy();
    var request = this.createQueue(function () { return d(); });
    var promise = request(spy);

    request();
    this.$apply();
    sinon.assert.calledTwice(d);
    sinon.assert.calledOnce(spy.withArgs(promise));
  });
});
