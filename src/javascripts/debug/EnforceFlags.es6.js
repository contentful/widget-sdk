import $window from '$window';
import {createElement as h} from 'libs/react';
import TheStore from 'TheStore';
import {uniq, without, omit} from 'lodash';
import {addNotification} from 'debug/DevNotifications';
import location from '$location';
import Cookies from 'Cookies';

/**
 * Stores enabled ui flags from url in local storage, and shows
 * a notification.
 */
export function init () {
  const urlParams = location.search();
  const enabledFlags = urlParams['ui_enable_flags'];
  setFromQuery(enabledFlags);
  if (enabledFlags) {
    // Updates url without reloading
    location.search(omit(urlParams, 'ui_enable_flags'));
  }
  displayNotification();
}

const store = TheStore.forKey('ui_enable_flags');

/**
 * Returns an array of ui flags enabled via query string param.
 */
export function getEnabledFlags () {
  return store.get() || [];
}

function setFromQuery (value = '') {
  if (value.length > 0) {
    store.set(uniq(value.split(',')));
  }
}

function removeFlag (flagName) {
  const enabledFlags = without(getEnabledFlags(), flagName);
  store.set(enabledFlags);
}

function displayNotification () {
  // Do not show the notification for automated end to end tests
  // b/c it makes some UI elements inaccessible which causes the
  // tests to fail.
  if (Cookies.get('cf_test_run')) {
    return;
  }
  const flags = getEnabledFlags();
  if (flags.length) {
    addNotification('Enabled flags:', h('ul', null, flags.map(renderFlagsListItem)));
  }
}

function renderFlagsListItem (flag) {
  const clearBtn = h('button', {
    className: 'btn-link',
    onClick: () => {
      removeFlag(flag);
      $window.location.reload();
    },
    style: {float: 'right', marginLeft: '3px'}
  }, 'Clear');
  return h('li', {key: flag}, flag, clearBtn);
}
