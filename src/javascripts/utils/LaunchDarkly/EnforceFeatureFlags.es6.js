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
 * Returns an array of ui features enabled via query string param.
 */
export function getEnabledFeatures () {
  return store.get() || [];
}

function setFromQuery (value) {
  const enabledFeatures = value && value.length ? value.split(',') : null;
  if (enabledFeatures) {
    store.set(enabledFeatures);
  }
}

function displayNotification () {
  $document.find('body').append(renderNotification());
}

function renderNotification () {
  const features = getEnabledFeatures();
  if (!features.length) {
    return '';
  } else {
    const ul = h('ul', features.map((f) => h('li', [f])));
    return h('div', {
      class: 'cf-ui-version-display'
    }, [h('h5', ['Enabled features:']), ul]);
  }
}
