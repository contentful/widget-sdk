import $window from '$window';
import $document from '$document';
import {h} from 'utils/hyperscript';
import TheStore from 'TheStore';
import {env} from 'environment';
import {uniq, without} from 'lodash';

/**
 * Stores enabled ui flags from value in local storage, and shows
 * a notification.
 * @param {String} enabledFlags
 */
export function init (enabledFlags) {
  if (env !== 'production') {
    setFromQuery(enabledFlags);
    displayNotification();
  }
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

function removeflag (flagName) {
  const enabledFlags = without(getEnabledFlags(), flagName);
  store.set(enabledFlags);
}

function displayNotification () {
  $document.find('body').append(renderNotification());

  $document.find('[data-cf-ui-flag-remove]').on('click', (el) => {
    const flagName = el.target.getAttribute('data-cf-ui-flag-remove');
    removeflag(flagName);
    $window.location.reload();
  });
}

function renderNotification () {
  const flags = getEnabledFlags();
  if (!flags.length) {
    return '';
  } else {
    const header = h('h5', {style: {margin: '8px 0'}}, ['Enabled flags:']);

    const ul = h('ul', flags.map(renderFlagsListItem));

    return h('.cf-ui-version-display', {
      style: {
        left: 0,
        right: 'auto'
      }
    }, [header, ul]);
  }
}

function renderFlagsListItem (flag) {
  const clearLink = h('a', {
    href: '#',
    dataCfUiflagRemove: flag,
    style: {float: 'right'}
  }, ['Clear']);
  return h('li', [flag, clearLink]);
}
