import handleGatekeeperMessage from './handleGatekeeperMessage';
import * as Components from '@contentful/forma-36-react-components';
import * as Window from 'core/services/window';
import * as CreateSpace from 'services/CreateSpace';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import * as UrlSyncHelper from 'account/UrlSyncHelper';
import * as Authentication from 'Authentication';
import * as NgRegistry from 'core/NgRegistry';

jest.mock('@contentful/forma-36-react-components');
jest.mock('core/services/window', () => ({
  window: {
    location: {},
  },
}));
jest.mock('services/CreateSpace');
jest.mock('services/TokenStore');
jest.mock('analytics/Analytics');
jest.mock('account/UrlSyncHelper');
jest.mock('Authentication');
jest.mock('core/NgRegistry');

describe('Gatekeeper Message Handler', () => {
  let stubs, Notification;
  beforeEach(async function () {
    stubs = {
      window: {
        location: '',
      },
      beginSpaceCreation: jest.fn(),
      refresh: jest.fn(),
      track: jest.fn(),
      $state: {},
      updateWebappUrl: jest.fn(),
      $location_url: jest.fn(),
      redirectToLogin: jest.fn(),
      cancelUser: jest.fn(),
    };

    Notification = {
      success: jest.fn(),
      error: jest.fn(),
    };
    Components.Notification = Notification;
    Window.window = stubs.window;
    CreateSpace.beginSpaceCreation = stubs.beginSpaceCreation;
    TokenStore.refresh = stubs.refresh;
    Analytics.track = stubs.track;
    UrlSyncHelper.updateWebappUrl = stubs.updateWebappUrl;
    Authentication.redirectToLogin = stubs.redirectToLogin;
    Authentication.cancelUser = stubs.cancelUser;

    NgRegistry.getModule = jest.fn().mockImplementation((type) => {
      if (type === '$state') {
        return stubs.$state;
      }
      if (type === '$location') {
        return {
          url: stubs.$location_url,
        };
      }
      return { $apply: jest.fn().mockImplementation((fn) => fn()) };
    });
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
      const currentStateName = 'some.current.name';
      stubs.$state.current = {
        name: currentStateName,
      };

      const data = {
        elementId: 'someId',
        groupId: 'someGroupId',
        fromState: '$state.current.name',
      };
      handleGatekeeperMessage({ type: 'analytics', event: 'element:click', data });
      const [_, eventData] = stubs.track.mock.calls[0];
      expect(eventData).toEqual({
        ...data,
        fromState: currentStateName,
      });
    });

    it('changes URL when triggered', function () {
      handleGatekeeperMessage({ action: 'navigate', type: 'location', path: 'blah/blah' });
      expect(stubs.$location_url).toHaveBeenCalledWith('blah/blah');
    });

    it('updates location', function () {
      handleGatekeeperMessage({ action: 'update', type: 'location', path: 'blah/blah' });
      expect(stubs.updateWebappUrl).toHaveBeenCalledWith('blah/blah');
    });

    it('refreshes token for any other message', function () {
      handleGatekeeperMessage({ blah: 'blah' });
      expect(stubs.refresh).toHaveBeenCalledTimes(1);
    });

    describe('handles gk errors', () => {
      beforeEach(function () {
        stubs.$state.go = jest.fn();
      });

      it('redirects to login', function () {
        handleGatekeeperMessage({ type: 'error', status: 401 });
        expect(stubs.redirectToLogin).toHaveBeenCalledTimes(1);
      });
    });
  });
});
