import $document from '$document';
import {h} from 'utils/hyperscript';
import TheStore from 'TheStore';
import {env} from 'environment';

/**
 * Stores enabled ui features from value in local storage, and shows
 * a notification.
 * @param {String} enabledFeatures
 */
export function init (enabledFeatures) {
  if (env !== 'production') {
    setFromQuery(enabledFeatures);
    displayNotification();
  }
}

const store = TheStore.forKey('ui_features');

/**
 * Returns a comma-separated list of ui features enabled via query string param.
 */
export function getEnabledFeatures () {
  return store.get() || '';
}

function setFromQuery (enabledFeatures) {
  if (enabledFeatures !== getEnabledFeatures()) {
    store.set(enabledFeatures);
  }
}

function displayNotification () {
  $document.find('body').append(renderNotification());
}

function renderNotification () {
  const features = getEnabledFeatures().split(',');
  if (!features.length) {
    return '';
  } else {
    const ul = h('ul', features.map((f) => h('li', [f])));
    return h('div', { style: {} }, [h('p', ['Enabled features:']), ul]);
  }
}
