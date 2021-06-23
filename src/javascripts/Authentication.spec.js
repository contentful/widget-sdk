import * as K from 'core/utils/kefir';
import * as Auth from './Authentication';
import { window } from 'core/services/window';
import { getBrowserStorage } from 'core/services/BrowserStorage';

jest.mock('core/services/window', () => ({
  window: {
    ...global.window,
    fetch: jest.fn(),
    location: '',
    addEventListener: jest.fn(),
  },
}));

describe('Authentication', function () {
  let store;

  beforeEach(() => {
    window.fetch.mockImplementation(async (uri) => {
      if (uri.startsWith('https://secure.ctfassets.net')) {
        return {
          json() {
            throw new Error('empty response');
          },
          ok: true,
        };
      } else {
        return {
          json: jest.fn(() => ({ access_token: 'NEW TOKEN' })),
          ok: true,
        };
      }
    });
    store = getBrowserStorage('session').forKey('token');
  });

  afterEach(() => {
    window.fetch.mockReset();
  });

  afterAll(() => {
    window.fetch.mockClear();
  });

  describe('#refreshToken()', function () {
    beforeEach(function () {
      store.set('STORED_TOKEN');
      Auth.init();
    });

    it('sends a form encoded post request with credentials', async function () {
      await Auth.refreshToken();
      expect(window.fetch).toHaveBeenCalledWith('https://be.contentful.com/oauth/token', {
        method: 'POST',
        body:
          'grant_type=password' +
          '&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
          '&scope=content_management_manage',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
      });
      expect(window.fetch).toHaveBeenCalledWith('https://secure.ctfassets.net/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: 'Bearer NEW TOKEN',
        },
      });
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

    it('does not issue a second request when one is in progress', async () => {
      await Promise.all([Auth.refreshToken(), Auth.refreshToken()]);
      expect(window.fetch).toHaveBeenCalledTimes(2);
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
      window.fetch.mockResolvedValue({
        json: jest.fn(() => ({ access_token: 'NEW TOKEN' })),
        ok: true,
      });
      Auth.init();
      expect(await Auth.getToken()).toBe('NEW TOKEN');
      expect(K.getValue(Auth.token$)).toBe('NEW TOKEN');
    });

    it('should not trigger logout if loggedOut value is null', async () => {
      const waitForLocationChange = async (window, initialValue, tries = 0) => {
        if (tries > 10) {
          throw new Error('location change did not occur in time');
        }

        if (window.location === initialValue) {
          await new Promise((resolve) => setTimeout(resolve, 10));

          return waitForLocationChange(window, initialValue, tries + 1);
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

      storageFn({ key: 'loggedOut', newValue: null });

      await expect(waitForLocationChange(window, '')).rejects.toThrow();
    });

    it('triggers logout if user logged out from another tab', async function () {
      const waitForLocationChange = async (window, initialValue, tries = 0) => {
        if (tries > 10) {
          throw new Error('location change did not occur in time');
        }

        if (window.location === initialValue) {
          await new Promise((resolve) => setTimeout(resolve, 10));

          return waitForLocationChange(window, initialValue, tries + 1);
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

      expect(window.location).not.toEqual('https://be.contentful.com/logout');

      await waitForLocationChange(window, '');

      expect(window.location).toEqual('https://be.contentful.com/logout');
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
      expect(window.fetch).toHaveBeenCalledWith('https://be.contentful.com/oauth/revoke', {
        body: 'token=NEW%20TOKEN&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        headers: {
          Authorization: 'Bearer NEW TOKEN',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      });
      expect(window.fetch).toHaveBeenCalledWith('https://secure.ctfassets.net/logout', {
        method: 'POST',
        credentials: 'include',
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
      window.fetch.mockRejectedValue();
      let caughtException = false;
      await Auth.logout().catch(function () {
        caughtException = true;
      });
      expect(caughtException).toBe(true);
      expect(window.location).toEqual('https://be.contentful.com/logout');
    });
  });
});
