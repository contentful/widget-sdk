import * as sinon from 'helpers/sinon';

describe('bugsnag', () => {
  beforeEach(function () {
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');
    this.LazyLoader = this.$inject('LazyLoader');

    this.BugsnagStub = {
      disableAutoBreadcrumbsConsole: sinon.stub(),
      enableNotifyUnhandledRejections: sinon.stub(),
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

  describe('user information', () => {
    it('is added for user without organizations', function () {
      this.bugsnag.enable({
        sys: {id: 'USER_ID'}
      });
      this.$apply();
      expect(this.BugsnagStub.user.id).toEqual('USER_ID');
      expect(this.BugsnagStub.user.organizations).toEqual('');
    });

    it('is added for user with organizations', function () {
      this.bugsnag.enable({
        sys: {id: 'UID'},
        organizationMemberships: [
          {organization: {sys: {id: 'foo'}}},
          {organization: {sys: {id: 'bar'}}}
        ]
      });
      this.$apply();
      expect(this.BugsnagStub.user.id).toEqual('UID');
      expect(this.BugsnagStub.user.organizations).toEqual('foo, bar');
    });
  });

  it('enabling after disabling does not send notifications', function () {
    this.bugsnag.enable();
    this.bugsnag.disable();
    this.$apply();
    this.bugsnag.notify('ERROR');
    this.$apply();
    sinon.assert.notCalled(this.BugsnagStub.notify);
  });

  describe('when script loading fails', () => {
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
