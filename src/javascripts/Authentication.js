import * as K from 'core/utils/kefir';
import { createMVar, createExclusiveTask } from 'utils/Concurrent';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import * as Config from 'Config';
import postForm from 'data/Request/PostForm';
import { window } from 'core/services/window';
import { captureWarning } from 'core/monitoring';

const getUrl = () => {
  return window.location.pathname + window.location.search || '';
};

/**
 * @name Authentication
 * @description
 * This module manages the global access token string.
 *
 * The main methods are
 *
 * - `getToken()` returns a promise for the current token
 * - `token$` is a property holding the current token
 * - `refreshToken()` gets a new token
 * - `init()` load previous data from local storage or call
 *   `refreshToken()`.
 */

const OAUTH_CLIENT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TOKEN_SCOPE = 'content_management_manage';

/**
 * We set this field in LocalStorage to indicate that the user has logged out.
 * Other instances of the webapp on the same browser will be listening to changes
 * on this key and will trigger logout.
 */
const LOGOUT_KEY = 'loggedOut';

/**
 * @description
 * MVar that holds that active token.
 *
 * Emits a new value whenever a token is successfully refreshed.
 */
const tokenMVar = createMVar();

const sessionStore = getBrowserStorage('session');
const localStore = getBrowserStorage('local');

const tokenStore =
  Config.env === 'development' ? localStore.forKey('token') : sessionStore.forKey('token');
/**
 * @description
 * Get the current token.
 *
 * If a token refresh is in progress when this function is called we
 * return the token that results from the refresh
 *
 * @returns {Promise<string>}
 */
export function getToken() {
  return tokenMVar.read();
}

const tokenBus = K.createPropertyBus(null);
export const token$ = tokenBus.property;

/**
 * @description
 * Request a new token from the OAuth token endpoint.
 *
 * If we fail to obtain a new token we redirect to the login page and
 * never resolve the promise.
 *
 * This function is used in the `data/Request/Auth` module and other
 * modules that make API requests. The function is called whenever a
 * request returns a 401.
 *
 * We use `createExclusiveTask` to make sure that we don’t call this
 * concurrently.
 *
 * @returns {Promise<string>}
 */
export const refreshToken = createExclusiveTask(async () => {
  tokenStore.remove();
  tokenMVar.empty();
  const token = await fetchNewToken();
  if (token) {
    try {
      await loginSecureAssets(token);
    } catch (error) {
      captureWarning(error);
    }

    tokenStore.set(token);
    updateToken(token);
    return token;
  } else {
    redirectToLogin();
  }
}).call;

/**
 * @description
 * Initializes the access token. Must be called before any other
 * function in this module.
 *
 * We try to obtain an access token from a previous session from
 * local storage. If no token is stored we call `refreshToken()`.
 *
 * If we land in the app being redirected from Gatekeeper’s login we
 * revoke any existing tokens and call `refreshToken()`. We also set
 * the path when we return from a login page after we were redirected
 * there by the app.
 *
 * This function is only called when the app is booted.
 *
 * This function returns true if the user will be redirected somewhere,
 * otherwise returns false.
 */
export function init() {
  localStore.remove(LOGOUT_KEY);
  localStore.externalChanges(LOGOUT_KEY).onValue((value) => {
    if (value !== null) {
      logout();
    }
  });

  // We need to get token from location hash when running the app on localhost.
  // See https://github.com/contentful/user_interface#using-staging-and-production-apis
  if (Config.env === 'development') {
    loadTokenFromHash();
  }

  const previousToken = tokenStore.get();

  if (!previousToken) {
    refreshToken();
    return false;
  }

  if (getUrl() === '/?login=1') {
    // This path indicates that we are coming from gatekeeper and we have
    // a new gatekeeper session. In that case we throw away our current
    // token since it might belong to a different user
    revokeToken(previousToken);
    refreshToken();
    return false;
  } else {
    updateToken(previousToken);

    if (Config.env === 'development') {
      // In production we use a session-scoped localStorage, so if we've already
      // logged in through usual means, the user should have already logged into
      // the secure assets domain (which has a session-scoped cookie).
      //
      // In development, we use localStorage / login via url hash, which won't
      // trigger the secure assets login unless we do the following:
      loginSecureAssets(previousToken).catch((error) => {
        captureWarning(error);
      });
    }

    return false;
  }
}

/**
 * @description
 * Revoke the current token and remove it from local storage. Redirect
 * to the logout page.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  const token = await tokenMVar.take();

  tokenStore.remove();
  localStore.set(LOGOUT_KEY, true);

  try {
    await revokeToken(token);
    try {
      await logoutSecureAssets();
    } catch (error) {
      captureWarning(error);
    }
  } finally {
    setLocation(Config.authUrl('logout'));
  }
}

/**
 * @description
 * Cancels user by clearing browser storage and redirecting to 'goodbye' page.
 */
export function cancelUser() {
  tokenStore.remove();
  setLocation(Config.websiteUrl('goodbye'));
}

/**
 * Redirect to the login page.
 *
 * We store the path that was being opened so that we can redirect when
 * we return from the login page.
 */
export function redirectToLogin() {
  tokenStore.remove();
  setLocation(Config.authUrl('login'));
}

function updateToken(value) {
  // We sync the token between windows using the 'storage' event. To
  // prevent unecessary updates we only update the stored value when it
  // has changed
  if (tokenStore.get() !== value) {
    tokenStore.set(value);
  }
  tokenBus.set(value);
  tokenMVar.put(value);
}

function setLocation(url) {
  window.location = url;
}

/**
 * Sends a request to Gatekeeper to revoke the given token.
 */
function revokeToken(token) {
  return postForm(
    Config.authUrl('oauth/revoke'),
    {
      token,
      client_id: OAUTH_CLIENT_ID,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

/**
 * Make a request to Gatekeeper’s OAuth endpoint to try to obtain a new
 * token.
 *
 * The returned promise is never rejected. A falsy value indicates that
 * we are unable to obtain a new token.
 *
 * @returns {Promise<string?>}
 */
function fetchNewToken() {
  return postForm(
    Config.authUrl('oauth/token'),
    {
      grant_type: 'password',
      client_id: OAUTH_CLIENT_ID,
      // redirect_uri: APP_HOST,
      scope: TOKEN_SCOPE,
    },
    {
      // We include the cookies from the Gatekeeper domain in the
      // request. This is used to authenticate and give us a new token.
      credentials: 'include',
    }
  )
    .then((response) => {
      return response?.access_token;
    })
    .catch(() => {
      return null;
    });
}

/**
 * Logs the user in to the secure assets endpoint
 * @param {string} cmaToken the cma token to use to log in
 */
async function loginSecureAssets(cmaToken) {
  const host = Config.secureAssetsUrl;
  if (!host) {
    return;
  }
  // These return 204, empty content, which postForm doesn't support
  const res = await window.fetch(`${host}/login`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cmaToken}`,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(res.text());
  }
}

/**
 * Logs out from the secure assets endpoint (should work regardless
 * of whether the user is actually logged in.)
 */
async function logoutSecureAssets() {
  const host = Config.secureAssetsUrl;
  if (!host) {
    return;
  }
  // These return 204, empty content, which postForm doesn't support
  const res = await window.fetch(`${host}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(res.text());
  }
}

function loadTokenFromHash() {
  const hash = window.location.hash;

  const match = hash.match(/access_token=([\w-]+)/);
  const token = match && match[1];
  if (token) {
    window.location.hash = '';
    tokenStore.set(token);
  }
}
