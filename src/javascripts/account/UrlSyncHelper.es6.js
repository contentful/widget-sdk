import $state from '$state';
import $location from '$location';
import { accountUrl } from 'Config';
import { extend, startsWith, endsWith } from 'lodash';

/**
 * @module account/UrlSyncHelper
 * @description
 * A module with helper functions to sync urls between webapp and gatekeeper
 * iframe.
 *
 * - `getGatekeeperUrl()` gets url of gatekeper iframe based on current state
 * - `updateUrl(gkUrl)` updates the webapp url
 */

export function getGatekeeperUrl() {
  const webappUrl = $location.url();
  const baseUrl = $state.href('account');

  if (!startsWith(webappUrl, baseUrl)) {
    return null;
  }

  let gkUrl = webappUrl.replace(baseUrl, '');
  // ui router escapes slashes in path suffix, we have to unescape them
  gkUrl = decodeURIComponent(gkUrl);
  return accountUrl(gkUrl);
}

/**
 * @description
 *
 * Updates webapp url, triggering a state change only if needed.
 *
 * We don't want to change state always because it would trigger iframe reload
 * in gatekeeper views. So, if the state is the same as the current one (except
 * for path suffix), it just updates the URL. Otherwise, it updates the
 * location, triggering a state change.
 *
 * @param {string} gkUrl
 */
export function updateWebappUrl(gkUrl = '') {
  gkUrl = endsWith(gkUrl, '/') ? gkUrl.substr(0, gkUrl.length - 1) : gkUrl;

  const baseUrl = $state.href($state.current.name, { pathSuffix: '' });
  const isCurrentState = startsWith(gkUrl, baseUrl);

  if (isCurrentState) {
    const pathSuffix = gkUrl.replace(baseUrl, '');
    const params = extend($state.params, { pathSuffix: pathSuffix });
    $state.go($state.current, params, { location: 'replace' });
  } else {
    $location.url(gkUrl);
  }
}
