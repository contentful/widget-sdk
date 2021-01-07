import * as UrlSyncHelper from 'account/UrlSyncHelper';
import * as NgRegistry from 'core/NgRegistry';

jest.mock('core/NgRegistry');

describe('account/UrlSyncHelper', () => {
  let $state, $location;
  beforeEach(async function () {
    $state = {
      href: jest.fn(),
      go: jest.fn(),
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
      $location.url.mockReturnValue('/account/profile/user/foo%2fbar');
      $state.href.mockReturnValue('/account');
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
      expect($state.go.mock.calls[0][1].pathSuffix).toBe('/blah/blah');
    });

    it('updates location if the state has changed', function () {
      const newPath = '/account/profile/space_memberships/blah/blah';
      UrlSyncHelper.updateWebappUrl(newPath);

      expect($state.go).not.toHaveBeenCalled();
      expect($location.url).toHaveBeenCalledTimes(1);
      expect($location.url).toHaveBeenCalledWith(newPath);
    });
  });
});
