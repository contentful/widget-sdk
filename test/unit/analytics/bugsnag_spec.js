import sinon from 'sinon';

import { $apply, $initialize } from 'test/utils/ng';

describe('bugsnag', () => {
  beforeEach(async function() {
    this.BugsnagStub = {
      disableAutoBreadcrumbsConsole: sinon.stub(),
      enableNotifyUnhandledRejections: sinon.stub(),
      notify: sinon.stub(),
      notifyException: sinon.stub(),
      refresh: sinon.stub()
    };
    this.get = sinon.stub().resolves(this.BugsnagStub);

    this.system.set('utils/LazyLoader', {
      get: this.get
    });

    this.bugsnag = await this.system.import('analytics/Bugsnag');

    await $initialize(this.system);
  });

  it('delegates #notify', function() {
    this.bugsnag.enable();
    $apply();
    this.bugsnag.notify('ERROR');
    sinon.assert.calledWithExactly(this.BugsnagStub.notify, 'ERROR');
  });

  it('delegates #notify after bugsnag has loaded', function() {
    this.bugsnag.notify('ERROR');
    sinon.assert.notCalled(this.BugsnagStub.notify);
    this.bugsnag.enable();
    $apply();
    sinon.assert.calledWithExactly(this.BugsnagStub.notify, 'ERROR');
  });

  it('loads script only once', function() {
    this.bugsnag.enable();
    $apply();
    sinon.assert.calledOnce(this.get);
    this.bugsnag.enable();
    $apply();
    sinon.assert.calledOnce(this.get);
  });

  describe('user information', () => {
    it('is added for user without organizations', function() {
      this.bugsnag.enable({
        sys: { id: 'USER_ID' }
      });
      $apply();
      expect(this.BugsnagStub.user.id).toEqual('USER_ID');
      expect(this.BugsnagStub.user.organizations).toEqual('');
    });

    it('is added for user with organizations', function() {
      this.bugsnag.enable({
        sys: { id: 'UID' },
        organizationMemberships: [
          { organization: { sys: { id: 'foo' } } },
          { organization: { sys: { id: 'bar' } } }
        ]
      });
      $apply();
      expect(this.BugsnagStub.user.id).toEqual('UID');
      expect(this.BugsnagStub.user.organizations).toEqual('foo, bar');
    });
  });

  it('enabling after disabling does not send notifications', function() {
    this.bugsnag.enable();
    this.bugsnag.disable();
    $apply();
    this.bugsnag.notify('ERROR');
    $apply();
    sinon.assert.notCalled(this.BugsnagStub.notify);
  });

  describe('when script loading fails', () => {
    beforeEach(function() {
      this.get = sinon.stub().rejects();
    });

    it('#notify() does not throw', function() {
      this.bugsnag.enable();
      $apply();
      this.bugsnag.notify();
    });
  });
});
