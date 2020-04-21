import { $initialize } from 'test/utils/ng';
import sinon from 'sinon';

describe('Gatekeeper Message Handler', () => {
  beforeEach(async function () {
    this.stubs = {
      window: {
        location: '',
      },
      showDialog: sinon.stub(),
      refresh: sinon.spy(),
      track: sinon.stub(),
      $state: {},
      updateWebappUrl: sinon.stub(),
      $location_url: sinon.spy(),
      redirectToLogin: sinon.spy(),
      cancelUser: sinon.spy(),
    };

    this.Notification = (
      await this.system.import('@contentful/forma-36-react-components')
    ).Notification;
    this.Notification.success = sinon.stub();
    this.Notification.error = sinon.stub();

    await this.system.set('core/services/window', {
      window: this.stubs.window,
    });

    await this.system.set('services/CreateSpace', {
      showDialog: this.stubs.showDialog,
    });

    await this.system.set('services/TokenStore', {
      refresh: this.stubs.refresh,
    });

    await this.system.set('analytics/Analytics', {
      track: this.stubs.track,
    });

    await this.system.set('account/UrlSyncHelper', {
      updateWebappUrl: this.stubs.updateWebappUrl,
    });

    await this.system.set('Authentication', {
      redirectToLogin: this.stubs.redirectToLogin,
      cancelUser: this.stubs.cancelUser,
    });

    this.handle = (await this.system.import('account/handleGatekeeperMessage')).default;

    await $initialize(this.system, ($provide) => {
      $provide.constant('$state', this.stubs.$state);
      $provide.constant('$location', {
        url: this.stubs.$location_url,
      });
    });
  });

  describe('actions on message', () => {
    it('logs out cancelled user and redirects them', function () {
      this.handle({ action: 'create', type: 'UserCancellation' });
      sinon.assert.calledOnce(this.stubs.cancelUser);
    });

    it('opens the space creation dialog', function () {
      this.handle({ action: 'new', type: 'space', organizationId: 'orgId' });
      sinon.assert.calledOnce(this.stubs.showDialog.withArgs('orgId'));
    });

    it('refreshes token when space is deleted', function () {
      this.handle({ action: 'delete', type: 'space' });
      sinon.assert.calledOnce(this.stubs.refresh);
    });

    it('shows notification', function () {
      this.handle({ type: 'flash', resource: { message: 'OK', type: 'info' } });
      this.handle({ type: 'flash', resource: { message: 'FAIL', type: 'error' } });
      sinon.assert.calledOnce(this.Notification.success.withArgs('OK'));
      sinon.assert.calledOnce(this.Notification.error.withArgs('FAIL'));
    });

    it('sends an analytics event', function () {
      const data = {
        elementId: 'someId',
        groupId: 'someGroupId',
      };
      this.handle({ type: 'analytics', event: 'element:click', data });
      expect(this.stubs.track.calledOnce).toBe(true);
      const [event, eventData] = this.stubs.track.getCall(0).args;
      expect(event).toBe('element:click');
      expect(eventData).toEqual(data);
    });

    it('sends an analytics event with resolved fromState', function () {
      const currentStateName = 'some.current.name';
      this.stubs.$state.current = {
        name: currentStateName,
      };

      const data = {
        elementId: 'someId',
        groupId: 'someGroupId',
        fromState: '$state.current.name',
      };
      this.handle({ type: 'analytics', event: 'element:click', data });
      const [_, eventData] = this.stubs.track.getCall(0).args;
      expect(eventData).toEqual({
        ...data,
        fromState: currentStateName,
      });
    });

    it('changes URL when triggered', function () {
      this.handle({ action: 'navigate', type: 'location', path: 'blah/blah' });
      sinon.assert.calledOnce(this.stubs.$location_url.withArgs('blah/blah'));
    });

    it('updates location', function () {
      this.handle({ action: 'update', type: 'location', path: 'blah/blah' });
      sinon.assert.calledOnce(this.stubs.updateWebappUrl.withArgs('blah/blah'));
    });

    it('refreshes token for any other message', function () {
      this.handle({ blah: 'blah' });
      sinon.assert.calledOnce(this.stubs.refresh);
    });

    describe('handles gk errors', () => {
      beforeEach(function () {
        this.stubs.$state.go = sinon.stub();
      });

      it('redirects to login', function () {
        this.handle({ type: 'error', status: 401 });
        sinon.assert.calledOnce(this.stubs.redirectToLogin);
      });
    });
  });
});
