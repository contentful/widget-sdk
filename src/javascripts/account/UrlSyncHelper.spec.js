import * as UrlSyncHelper from 'account/UrlSyncHelper';
import * as NgRegistry from 'core/NgRegistry';
import { window } from 'core/services/window';

jest.mock('core/NgRegistry');

jest.mock('core/services/window', () => ({
  window: {
    location: { pathname: '' },
  },
}));

describe('account/UrlSyncHelper', () => {
  let $state, $location;
  beforeEach(async function () {
    $state = {
      href: jest.fn(),
      transitionTo: jest.fn(),
      current: {},
    };
    $location = {
      url: jest.fn(),
    };

    NgRegistry.getModule = jest.fn().mockImplementation((type) => {
      if (type === '$state') {
        return $state;
      }
      if (type === '$location') {
        return $location;
      }
    });
  });

  describe('.getGatekeeperUrl()', () => {
    beforeEach(function () {
      window.location.pathname = '/account/profile/user/foo%2fbar';
    });
    it('returns gatekeeper url', function () {
      expect(UrlSyncHelper.getGatekeeperUrl()).toBe('//be.test.com/account/profile/user/foo/bar');
    });
  });

  describe('.updateWebappUrl()', () => {
    beforeEach(function () {
      $state.current.name = 'account.profile.foo';
      $state.href.mockImplementation((arg) => {
        if (arg === $state.current.name) {
          return '/account/profile/user';
        }
        return '/account/profile/user/foo/bar';
      });
    });

    it('silently updates URL if state is the same', function () {
      UrlSyncHelper.updateWebappUrl('/account/profile/user/blah/blah');
      expect($state.transitionTo.mock.calls[0][1].pathname).toBe('/blah/blah');
    });

    it('updates location if the state has changed', function () {
      const newPath = '/account/profile/space_memberships/blah/blah';
      UrlSyncHelper.updateWebappUrl(newPath);

      expect($state.transitionTo).not.toHaveBeenCalled();
      expect($location.url).toHaveBeenCalledTimes(1);
      expect($location.url).toHaveBeenCalledWith(newPath);
    });
  });
});
