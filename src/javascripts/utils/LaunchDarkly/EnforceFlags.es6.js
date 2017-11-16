import $window from '$window';
import $document from '$document';
import {h} from 'utils/hyperscript';
import TheStore from 'TheStore';
import {uniq, without} from 'lodash';
import {addNotification} from 'utils/DevNotifications';

/**
 * Stores enabled ui flags from value in local storage, and shows
 * a notification.
 * @param {String} enabledFlags
 */
export function init (enabledFlags) {
  setFromQuery(enabledFlags);
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
  const flags = getEnabledFlags();
  if (flags.length) {
    addNotification('Enabled flags:', h('ul', flags.map(renderFlagsListItem)));

    $document.find('[data-cf-ui-flag-remove]').on('click', (el) => {
      const flagName = el.target.getAttribute('data-cf-ui-flag-remove');
      removeFlag(flagName);
      $window.location.reload();
    });
  }
}

function renderFlagsListItem (flag) {
  const clearLink = h('a', {
    href: '#',
    dataCfUiFlagRemove: flag,
    style: {float: 'right'}
  }, ['Clear']);
  return h('li', [flag, clearLink]);
}
