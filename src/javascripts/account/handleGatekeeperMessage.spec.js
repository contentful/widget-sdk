import handleGatekeeperMessage from './handleGatekeeperMessage';
import * as Components from '@contentful/forma-36-react-components';
import * as CreateSpace from 'services/CreateSpace';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import * as Authentication from 'Authentication';
import * as Navigator from 'states/Navigator';
import { window } from 'core/services/window';

jest.mock('features/assembly-types', () => ({
  useIsComposeInstalledFlag: jest.fn(() => true),
}));
jest.mock('@contentful/forma-36-react-components');
jest.mock('core/services/window', () => ({
  window: {
    setTimeout: jest.fn().mockImplementation((fn) => fn()),
    location: {},
  },
}));
jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn(),
  go: jest.fn(),
}));
jest.mock('services/CreateSpace');
jest.mock('services/TokenStore');
jest.mock('analytics/Analytics');
jest.mock('Authentication');

describe('Gatekeeper Message Handler', () => {
  let stubs, Notification;
  beforeEach(async function () {
    stubs = {
      beginSpaceCreation: jest.fn(),
      refresh: jest.fn(),
      track: jest.fn(),
      redirectToLogin: jest.fn(),
      cancelUser: jest.fn(),
    };

    Notification = {
      success: jest.fn(),
      error: jest.fn(),
    };
    Components.Notification = Notification;
    CreateSpace.beginSpaceCreation = stubs.beginSpaceCreation;
    TokenStore.refresh = stubs.refresh;
    Analytics.track = stubs.track;
    Authentication.redirectToLogin = stubs.redirectToLogin;
    Authentication.cancelUser = stubs.cancelUser;
  });

  describe('actions on message', () => {
    it('logs out cancelled user and redirects them', function () {
      handleGatekeeperMessage({ action: 'create', type: 'UserCancellation' });
      expect(stubs.cancelUser).toHaveBeenCalledTimes(1);
    });

    it('opens the space creation dialog', function () {
      handleGatekeeperMessage({ action: 'new', type: 'space', organizationId: 'orgId' });
      expect(stubs.beginSpaceCreation).toHaveBeenCalledWith('orgId');
    });

    it('refreshes token when space is deleted', function () {
      handleGatekeeperMessage({ action: 'delete', type: 'space' });
      expect(stubs.refresh).toHaveBeenCalledTimes(1);
    });

    it('shows notification', function () {
      handleGatekeeperMessage({ type: 'flash', resource: { message: 'OK', type: 'info' } });
      handleGatekeeperMessage({ type: 'flash', resource: { message: 'FAIL', type: 'error' } });
      expect(Notification.success).toHaveBeenCalledWith('OK');
      expect(Notification.error).toHaveBeenCalledWith('FAIL', { id: 'gatekeeper-error' });
    });

    it('sends an analytics event', function () {
      const data = {
        elementId: 'someId',
        groupId: 'someGroupId',
      };
      handleGatekeeperMessage({ type: 'analytics', event: 'element:click', data });
      expect(stubs.track).toHaveBeenCalledTimes(1);
      const [event, eventData] = stubs.track.mock.calls[0];
      expect(event).toBe('element:click');
      expect(eventData).toEqual(data);
    });

    it('sends an analytics event with resolved fromState', function () {
      Navigator.getCurrentStateName.mockReturnValueOnce('some.current.name');

      const data = {
        elementId: 'someId',
        groupId: 'someGroupId',
        fromState: '$state.current.name',
      };
      handleGatekeeperMessage({ type: 'analytics', event: 'element:click', data });
      const [_, eventData] = stubs.track.mock.calls[0];
      expect(eventData).toEqual({
        ...data,
        fromState: 'some.current.name',
      });
    });

    it('changes URL when triggered', function (done) {
      handleGatekeeperMessage({ action: 'navigate', type: 'location', path: 'blah/blah' });
      process.nextTick(() => {
        expect(window.location.pathname).toEqual('blah/blah');
        done();
      });
    });

    it('refreshes token for any other message', function () {
      handleGatekeeperMessage({ blah: 'blah' });
      expect(stubs.refresh).toHaveBeenCalledTimes(1);
    });

    describe('handles gk errors', () => {
      it('redirects to login', function () {
        handleGatekeeperMessage({ type: 'error', status: 401 });
        expect(stubs.redirectToLogin).toHaveBeenCalledTimes(1);
      });
    });
  });
});
