import { get } from 'lodash';
import * as K from 'core/utils/kefir';
import { createMVar, createExclusiveTask } from 'utils/Concurrent';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import * as Config from 'Config';
import postForm from 'data/Request/PostForm';
import { getModule } from 'core/NgRegistry';
import { window } from 'core/services/window';

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

const store = getBrowserStorage();
const sessionStore = getBrowserStorage('session');
const localStore = getBrowserStorage('local');

const afterLoginPathStore = store.forKey('redirect_after_login');

const tokenStore =
  Config.env === 'development' ? store.forKey('token') : sessionStore.forKey('token');
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
export const refreshToken = createExclusiveTask(() => {
  tokenStore.remove();
  tokenMVar.empty();
  return fetchNewToken().then((token) => {
    if (token) {
      tokenStore.set(token);
      updateToken(token);
      return token;
    } else {
      redirectToLogin();
    }
  });
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
 * revoke any existing tokens and call `refreshToken()`.
 *
 * We also set the path when we return from a login page after we were
 * redirected there by the app.
 *
 * This function is only called when the app is booted.
 */
export function init() {
  const $location = getModule('$location');

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

  if (previousToken && $location.url() === '/?login=1') {
    // This path indicates that we are coming from gatekeeper and we have
    // a new gatekeeper session. In that case we throw away our current
    // token since it might belong to a different user
    revokeToken(previousToken);
    refreshAndRedirect();
  } else if (!previousToken) {
    refreshAndRedirect();
  } else {
    updateToken(previousToken);
  }
}

function refreshAndRedirect() {
  const $location = getModule('$location');

  refreshToken();

  const afterLoginPath = afterLoginPathStore.get();
  if (afterLoginPath) {
    afterLoginPathStore.remove();
    // https://stackoverflow.com/questions/24764330/location-changes-the-parameter-delimiter
    // $location.path escapes '?' symbol
    // https://stackoverflow.com/questions/31838484/difference-between-location-path-and-location-url
    // more on the difference between $location.path/$location.url
    $location.url(afterLoginPath);
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
  afterLoginPathStore.remove();
  setLocation(Config.websiteUrl('goodbye'));
}

/**
 * Redirect to the login page.
 *
 * We store the path that was being opened so that we can redirect when
 * we return from the login page.
 */
export function redirectToLogin() {
  const $location = getModule('$location');

  tokenStore.remove();
  afterLoginPathStore.set($location.url());
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
      withCredentials: true,
    }
  )
    .then((response) => {
      return get(response, 'data.access_token');
    })
    .catch(() => {
      return null;
    });
}

function loadTokenFromHash() {
  const $location = getModule('$location');

  const match = $location.hash().match(/access_token=([\w-]+)/);
  const token = match && match[1];
  if (token) {
    $location.hash('');
    tokenStore.set(token);
  }
}
