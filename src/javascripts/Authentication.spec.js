import * as K from 'core/utils/kefir';
import * as Auth from './Authentication';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { window } from 'core/services/window';
import $httpMocked from 'ng/$http';
import $locationMocked from 'ng/$location';

jest.mock('ng/$http', () => jest.fn());
jest.mock('ng/$location', () => ({
  url: jest.fn(),
}));

jest.mock('core/services/window', () => ({
  window: {
    ...global.window,
    location: '',
  },
}));

describe('Authentication', function () {
  let store;

  beforeEach(() => {
    $httpMocked.mockResolvedValue({ data: { access_token: 'NEW TOKEN' } });

    store = getBrowserStorage('session').forKey('token');
  });

  afterEach(() => {
    $httpMocked.mockReset();
  });

  describe('#refreshToken()', function () {
    beforeEach(function () {
      store.set('STORED_TOKEN');
      Auth.init();
    });

    it('sends a form encoded post request with credentials', function () {
      Auth.refreshToken();
      expect($httpMocked).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://be.contentful.com/oauth/token',
        data:
          'grant_type=password' +
          '&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
          '&scope=content_management_manage',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
      });
    });

    it('emits token on token$', async function () {
      const tokenRef = K.getRef(Auth.token$);
      expect(tokenRef.value).toBe('STORED_TOKEN');
      await Auth.refreshToken();
      expect(tokenRef.value).toBe('NEW TOKEN');
    });

    it('stores the new token in local storage', async function () {
      await Auth.refreshToken();
      expect(store.get()).toBe('NEW TOKEN');
    });

    it('returns new token', async function () {
      const token = await Auth.refreshToken();
      expect(token).toBe('NEW TOKEN');
    });

    it('updates getToken() promise', async function () {
      expect(await Auth.getToken()).toBe('STORED_TOKEN');
      await Auth.refreshToken();
      expect(await Auth.getToken()).toBe('NEW TOKEN');
    });

    it('does not issue a second request when one is in progress', () => {
      Auth.refreshToken();
      Auth.refreshToken();
      expect($httpMocked).toHaveBeenCalledTimes(1);
    });
  });

  describe('#init()', function () {
    it('obtains token from local storage', async function () {
      store.set('STORED_TOKEN');
      Auth.init();
      expect(K.getValue(Auth.token$)).toBe('STORED_TOKEN');
      expect(await Auth.getToken()).toBe('STORED_TOKEN');
    });
    it('sends authentication request without stored token', async function () {
      store.remove();
      $httpMocked.mockResolvedValue({ data: { access_token: 'NEW TOKEN' } });
      Auth.init();
      expect(await Auth.getToken()).toBe('NEW TOKEN');
      expect(K.getValue(Auth.token$)).toBe('NEW TOKEN');
    });

    it('triggers logout if user logged out from another tab', async function () {
      const waitForLocationChange = async (window, initialValue) => {
        if (window.location === initialValue) {
          await new Promise((resolve) => setTimeout(resolve, 10));

          return waitForLocationChange(window, initialValue);
        }

        return true;
      };

      let storageFn;
      jest.spyOn(window, 'addEventListener').mockImplementation((name, fn) => {
        if (name === 'storage') {
          storageFn = fn;
        }
      });

      store.set('STORED_TOKEN');
      Auth.init();

      storageFn({ key: 'loggedOut', newValue: true });

      await waitForLocationChange(window, '');

      expect(window.location).toEqual('https://be.contentful.com/logout');
    });

    describe('on login from gatekeeper', function () {
      beforeEach(function () {
        $locationMocked.url.mockReturnValue('/?login=1');
      });
      it('revokes and deletes existing token', async function () {
        store.set('STORED_TOKEN');
        Auth.init();
        expect(store.get()).toBeNull();
        expect($httpMocked.mock.calls[0]).toEqual([
          {
            data:
              'token=STORED_TOKEN&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            headers: {
              Authorization: 'Bearer STORED_TOKEN',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            url: 'https://be.contentful.com/oauth/revoke',
          },
        ]);
      });
      it('gets a new token', async function () {
        store.set('STORED_TOKEN');
        Auth.init();

        expect($httpMocked.mock.calls[1]).toEqual([
          {
            data:
              'grant_type=password&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&scope=content_management_manage',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            url: 'https://be.contentful.com/oauth/token',
            withCredentials: true,
          },
        ]);
      });
    });
  });

  describe('#logout()', function () {
    function delay(ms) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, ms);
      });
    }

    it('deletes the token from local storage', async function () {
      const setMock = jest.spyOn(global.Storage.prototype, 'setItem');
      const removeMock = jest.spyOn(global.Storage.prototype, 'removeItem');
      Auth.init();
      await delay(10);
      expect(setMock).toHaveBeenCalledWith('token', 'NEW TOKEN');
      await Auth.logout();
      expect(store.get()).toBeNull();
      expect(removeMock).toHaveBeenCalledWith('token');
      expect(setMock).toHaveBeenCalledWith('loggedOut', 'true');
      expect($httpMocked).toHaveBeenCalledWith({
        data:
          'token=NEW%20TOKEN&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        headers: {
          Authorization: 'Bearer NEW TOKEN',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        url: 'https://be.contentful.com/oauth/revoke',
      });
      setMock.mockRestore();
      removeMock.mockRestore();
    });

    it('redirects to the logout page', async function () {
      await Auth.init();
      await delay(10);
      await Auth.logout();
      expect(window.location).toEqual('https://be.contentful.com/logout');
    });

    it('redirects to the logout page if revokation fails', async function () {
      await Auth.init();
      $httpMocked.mockRejectedValue();
      let caughtException = false;
      await Auth.logout().catch(function () {
        caughtException = true;
      });
      expect(caughtException).toBe(true);
      expect(window.location).toEqual('https://be.contentful.com/logout');
    });
  });
});
