'use strict';

describe('bugsnag', function () {
  beforeEach(function () {
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');
    this.LazyLoader = this.$inject('LazyLoader');

    this.BugsnagStub = {
      notify: sinon.stub(),
      notifyException: sinon.stub(),
      refresh: sinon.stub()
    };

    this.LazyLoader.get = sinon.stub().resolves(this.BugsnagStub);
  });

  it('delegates #notify', function () {
    this.bugsnag.enable();
    this.$apply();
    this.bugsnag.notify('ERROR');
    sinon.assert.calledWithExactly(this.BugsnagStub.notify, 'ERROR');
  });

  it('delegates #notify after bugsnag has loaded', function () {
    this.bugsnag.notify('ERROR');
    sinon.assert.notCalled(this.BugsnagStub.notify);
    this.bugsnag.enable();
    this.$apply();
    sinon.assert.calledWithExactly(this.BugsnagStub.notify, 'ERROR');
  });

  it('loads script only once', function () {
    this.bugsnag.enable();
    this.$apply();
    sinon.assert.calledOnce(this.LazyLoader.get);
    this.bugsnag.enable();
    this.$apply();
    sinon.assert.calledOnce(this.LazyLoader.get);
  });

  it('enabling after disabling does not send notifications', function () {
    this.bugsnag.enable();
    this.bugsnag.disable();
    this.$apply();
    this.bugsnag.notify('ERROR');
    this.$apply();
    sinon.assert.notCalled(this.BugsnagStub.notify);
  });

  describe('when script loading fails', function () {
    beforeEach(function () {
      this.LazyLoader.get = sinon.stub().rejects();
    });

    it('#notify() does not throw', function () {
      this.bugsnag.enable();
      this.$apply();
      this.bugsnag.notify();
    });
  });
});
