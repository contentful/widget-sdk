import $window from '$window';
import React from 'react';
import { getStore } from 'TheStore';
import { uniq, without, omit } from 'lodash';
import { addNotification } from 'debug/DevNotifications.es6';
import location from '$location';
import Cookies from 'Cookies';

const ENABLE_FLAGS_KEY = 'ui_enable_flags';
const DISABLE_FLAGS_KEY = 'ui_disable_flags';

const storeForEnable = getStore().forKey(ENABLE_FLAGS_KEY);
const storeForDisable = getStore().forKey(DISABLE_FLAGS_KEY);

/**
 * Stores enabled ui flags from url in local storage, and shows
 * a notification.
 */
export function init() {
  const urlParams = location.search();
  const enabledFlags = urlParams[ENABLE_FLAGS_KEY];
  const disabledFlags = urlParams[DISABLE_FLAGS_KEY];

  setFromQuery(enabledFlags, storeForEnable);
  setFromQuery(disabledFlags, storeForDisable);
  if (enabledFlags || disabledFlags) {
    // Updates url without reloading
    location.search(omit(urlParams, ENABLE_FLAGS_KEY, DISABLE_FLAGS_KEY));
  }
  displayNotification();
}

/**
 * Returns an array of ui flags enabled via query string param.
 */
export function getEnabledFlags() {
  return storeForEnable.get() || [];
}

export function getDisabledFlags() {
  return storeForDisable.get() || [];
}

function setFromQuery(value = '', store) {
  if (value.length > 0) {
    store.set(uniq(value.split(',')));
  }
}

function removeEnabledFlag(flagName) {
  const enabledFlags = without(getEnabledFlags(), flagName);
  storeForEnable.set(enabledFlags);
}

function removeDisabledFlag(flagName) {
  const disabledFlags = without(getDisabledFlags(), flagName);
  storeForDisable.set(disabledFlags);
}

function displayNotification() {
  // Do not show the notification for automated end to end tests
  // b/c it makes some UI elements inaccessible which causes the
  // tests to fail.
  if (Cookies.get('cf_test_run')) {
    return;
  }
  const enabledFlags = getEnabledFlags();
  if (enabledFlags.length) {
    addNotification(
      'Enabled flags:',
      <ul>{enabledFlags.map(flag => renderFlagsListItem(flag, removeEnabledFlag))}</ul>
    );
  }

  const disabledFlags = getDisabledFlags();
  if (disabledFlags.length) {
    addNotification(
      'Disabled flags:',
      <ul>{disabledFlags.map(flag => renderFlagsListItem(flag, removeDisabledFlag))}</ul>
    );
  }
}

function renderFlagsListItem(flag, removeFn) {
  const clearBtn = (
    <button
      className="btn-link"
      onClick={() => {
        removeFn(flag);
        $window.location.reload();
      }}
      style={{ float: 'right', marginLeft: '3px' }}>
      Clear
    </button>
  );
  return (
    <li key={flag}>
      {flag}
      {clearBtn}
    </li>
  );
}
