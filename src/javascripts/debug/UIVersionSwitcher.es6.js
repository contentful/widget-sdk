/**
* Switches the UI version if a `ui_version` query string parameter is specified.
* It also displays the version in the UI and provides an easy way to clear it.
*/
import $window from '$window';
import $document from '$document';
import Cookies from 'Cookies';
import {omit, toPairs} from 'lodash';
import moment from 'moment';
import {gitRevision} from 'environment';
import {h} from 'utils/hyperscript';
import {addNotification} from 'debug/DevNotifications';
import location from '$location';

/**
 * If url param is given, sets `ui_version` cookie and reloads the app with
 * given ui version. Otherwise shows a notification, if ui version is set
 * with cookie.
 */
export function init () {
  const urlParams = location.search();
  const uiVersion = urlParams['ui_version'];

  if (uiVersion) {
    setVersionCookie(uiVersion);
    // This will reload the app with new ui version
    $window.location.search = '?' + toUrlParamsString(omit(urlParams, 'ui_version'));
  }
  addVersionNotification();
}

function setVersionCookie (uiVersion) {
  Cookies.set('ui_version', uiVersion, {
    expires: moment().add(24, 'h').toDate()
  });
}

function addVersionNotification () {
  // This cookie is set to hide version notification in automated test runs:
  // https://github.com/contentful/ui_integration_suite/blob/c57d378def523b782decff3d02d2b3507b541fa5/app/application.py#L283
  const isTestRun = !!Cookies.get('cf_test_run');
  const uiVersion = Cookies.get('ui_version');
  if (!uiVersion || isTestRun) {
    return;
  }

  addNotification('Contentful UI Version:', renderVersionNotification(gitRevision));

  $document.find('[data-cf-ui-version-reload]').on('click', () => {
    Cookies.remove('ui_version');
    $window.location.reload();
  });
}

function renderVersionNotification (gitRevision) {
  return h('div', [
    h('a', {href: `?ui_version=${gitRevision}`}, [gitRevision]),
    h('a', {href: '#', dataCfUiVersionReload: true, style: {marginLeft: '3px'}}, ['Clear'])
  ]);
}

function toUrlParamsString (params) {
  return toPairs(params).map(([k, v]) => k + '=' + v).join('&');
}
