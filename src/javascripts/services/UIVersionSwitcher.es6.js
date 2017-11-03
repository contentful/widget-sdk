/**
* Switches the UI version if a `ui_version` query string parameter is specified.
* It also displays the version in the UI and provides an easy way to clear it.
*/
import $window from '$window';
import $document from '$document';
import Cookies from 'Cookies';
import moment from 'moment';
import {gitRevision, env} from 'environment';
import {h} from 'utils/hyperscript';

/**
 * Sets `ui_version` cookie from value, and shows a notification.
 * @param {String} uiVersion
 */
export function init (uiVersion) {
  if (env !== 'production') {
    const isTestRun = !!Cookies.get('cf_test_run');
    uiVersion = uiVersion || Cookies.get('ui_version');
    setVersionCookie(uiVersion);
    if (uiVersion && gitRevision !== uiVersion && !isTestRun) {
      addVersionNotification();
    }
  }
}

function setVersionCookie (uiVersion) {
  Cookies.set('ui_version', uiVersion, {
    expires: moment().add(24, 'h').toDate()
  });
}

function addVersionNotification () {
  $document.find('body').append(renderVersionNotification({gitRevision}));

  $document.find('[data-cf-ui-version-reload]').on('click', () => {
    Cookies.remove('ui_version');
    $window.location.reload();
  });
}

function renderVersionNotification ({gitRevision}) {
  return h('div', {class: 'cf-ui-version-display'}, [
    'Contentful UI Version: ',
    h('a', {href: `?ui_version=${gitRevision}`}, [gitRevision]),
    h('a', {href: '#', dataCfUiVersionReload: true}, ['Clear'])
  ]);
}
