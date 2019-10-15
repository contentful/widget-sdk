/**
 * Switches the UI version if a `ui_version` query string parameter is specified.
 * It also displays the version in the UI and provides an easy way to clear it.
 */
import Cookies from 'js-cookie';
import { omit } from 'lodash';
import moment from 'moment';
import React from 'react';
import { TextLink, Button } from '@contentful/forma-36-react-components';
import { addNotification } from 'debug/DevNotifications.es6';
import * as locationUtils from 'utils/location';
import window from 'utils/ngCompat/window.es6';
import { css } from 'emotion';

/**
 * If url param is given, sets `ui_version` cookie and reloads the app with
 * given ui version. Otherwise shows a notification, if ui version is set
 * with cookie.
 */
export function init() {
  const urlParams = locationUtils.getQueryString();
  const uiVersion = urlParams['ui_version'];

  if (uiVersion) {
    setVersionCookie(uiVersion);
    // This will reload the app with new ui version
    locationUtils.setQueryString(omit(urlParams, 'ui_version'));
  }
  addVersionNotification();
}

function setVersionCookie(uiVersion) {
  Cookies.set('ui_version', uiVersion, {
    expires: moment()
      .add(24, 'h')
      .toDate()
  });
}

function addVersionNotification() {
  // This cookie is set to hide version notification in automated test runs:
  // https://github.com/contentful/ui_integration_suite/blob/c57d378def523b782decff3d02d2b3507b541fa5/app/application.py#L283
  const isTestRun = !!Cookies.get('cf_test_run');
  const uiVersion = Cookies.get('ui_version');
  if (!uiVersion || isTestRun) {
    return;
  }
  addNotification('Contentful UI Version:', renderVersionNotification(uiVersion));
}

const styles = {
  buttonLink: css({
    marginLeft: '3px',
    marginTop: '5px'
  })
};

function renderVersionNotification(gitRevision) {
  return (
    <div>
      <TextLink href={`?ui_version=${gitRevision}`}>{gitRevision}</TextLink>
      <Button
        isFullWidth
        size="small"
        onClick={removeUiVersion}
        data-cf-ui-version-reload
        className={styles.buttonLink}>
        Clear
      </Button>
    </div>
  );
}

function removeUiVersion() {
  Cookies.remove('ui_version');
  window.location.reload();
}