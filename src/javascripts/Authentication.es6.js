import {get} from 'lodash';
import $location from '$location';
import $window from '$window';
import * as K from 'utils/kefir';
import { createMVar$q, runTask } from 'utils/Concurrent';
import TheStore from 'TheStore';
import * as Config from 'Config';
import postForm from 'data/Request/PostForm';

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
 * @description
 * MVar that holds that active token.
 *
 * Emits a new value whenever a token is successfully refreshed.
 */
const tokenMVar = createMVar$q();

const tokenStore = TheStore.forKey('token');
const afterLoginPathStore = TheStore.forKey('redirect_after_login');

/**
 * @description
 * Get the current token.
 *
 * If a token refresh is in progress when this function is called we
 * return the token that results from the refresh
 *
 * @returns {Promise<string>}
 */
export function getToken () {
  return tokenMVar.read();
}

const tokenBus = K.createPropertyBus(null);
export const token$ = tokenBus.property;


/**
 * @description
 * Initializes the access token. Must be called before any other
 * function in this module.
 *
 * We try to obtain an access token from a previous session from
 * local storage. If no token is stored we call `refreshToken()`.
 *
 * We also set the path when we return from a login page after we were
 * redirected there by the app.
 *
 * This function is only called when the app is booted.
 */
export function init () {
  // We need to get token from location hash when running the app on localhost.
  // See https://github.com/contentful/user_interface#using-staging-and-production-apis
  if (Config.env === 'development') {
    loadTokenFromHash();
  }

  const storedToken = tokenStore.get();
  updateToken(storedToken);

  // Reflect token updates that happened in a different window
  tokenStore.externalChanges().onValue(updateToken);

  if (!storedToken) {
    // Obtain token for the first time after login
    refreshToken();

    const afterLoginPath = afterLoginPathStore.get();
    if (afterLoginPath) {
      afterLoginPathStore.remove();
      $location.path(afterLoginPath);
    }
  }
}

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
 * @returns {Promise<string>}
 */
export function refreshToken () {
  if (tokenMVar.isEmpty()) {
    // token MVar is empty only when a refresh is already in progress
    return tokenMVar.read();
  } else {
    tokenStore.remove();
    tokenMVar.empty();

    fetchNewToken().then((token) => {
      if (token) {
        tokenStore.set(token);
        updateToken(token);
      } else {
        redirectToLogin();
      }
    });
    return tokenMVar.read();
  }
}


/**
 * @description
 * Revoke the current token and remove it from local storage. Redirect
 * to the logout page.
 *
 * @returns {Promise<void>}
 */
export function logout () {
  return runTask(function* () {
    const token = yield tokenMVar.take();
    tokenStore.remove();
    try {
      yield postForm(Config.authUrl('oauth/revoke'), {
        token: token
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } finally {
      setLocation(Config.authUrl('logout'));
    }
  });
}


/**
 * @description
 * Cancels user by clearing browser storage and redirecting to 'goodbye' page.
 */
export function cancelUser () {
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
export function redirectToLogin () {
  tokenStore.remove();
  afterLoginPathStore.set($location.url());
  setLocation(Config.authUrl('login'));
}

function updateToken (value) {
  tokenBus.set(value);
  tokenMVar.put(value);
}

function setLocation (url) {
  $window.location = url;
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
function fetchNewToken () {
  return postForm(Config.authUrl('oauth/token'), {
    grant_type: 'password',
    client_id: OAUTH_CLIENT_ID,
    // redirect_uri: APP_HOST,
    scope: TOKEN_SCOPE
  }, {
    // We include the cookies from the Gatekeeper domain in the
    // request. This is used to authenticate and give us a new token.
    withCredentials: true
  })
  .then((response) => {
    return get(response, 'data.access_token');
  }).catch(() => {
    return null;
  });
}

function loadTokenFromHash () {
  const match = $location.hash().match(/access_token=(\w+)/);
  const token = match && match[1];
  if (token) {
    $location.hash('');
    tokenStore.set(token);
  }
}
