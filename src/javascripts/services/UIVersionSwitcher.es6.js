/**
* Switches the UI version if a `ui_version` query string parameter is specified.
* It also displays the version in the UI and provides an easy way to clear it.
*/
import $location from '$location';
import $window from '$window';
import $document from '$document';
import Cookies from 'Cookies';
import moment from 'moment';
import {gitRevision} from 'environment';

export function checkIfVersionShouldBeSwitched () {
  setVersionFromQuery();
  addVersionNotification();
}

function setVersionFromQuery () {
  const uiVersion = $location.search().ui_version;
  if (uiVersion) {
    Cookies.set('ui_version', uiVersion, {
      expires: moment().add(24, 'h').toDate()
    });
    if (gitRevision !== uiVersion) {
      // This reloads the page without the query string
      $window.location.search = '';
    }
  }
}

function addVersionNotification () {
  const previewVersion = Cookies.get('ui_version');
  const isTestRun = !!Cookies.get('cf_test_run');
  if (!previewVersion || isTestRun) {
    return;
  }

  $document.find('body')
  .append(
    '<div class="cf-ui-version-display">Contentful UI Version: ' +
    '<a href="?ui_version=' + gitRevision + '">' + gitRevision + '</a> ' +
    '<a href="#" data-cf-ui-version-reload>Clear</a></div>'
  );

  $document.find('[data-cf-ui-version-reload]').on('click', () => {
    Cookies.remove('ui_version');
    $window.location.reload();
  });
}
