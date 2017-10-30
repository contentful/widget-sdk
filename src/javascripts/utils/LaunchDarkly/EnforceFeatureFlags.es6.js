import $location from '$location';
import $window from '$window';
import $document from '$document';
import {h} from 'utils/hyperscript';
import TheStore from 'TheStore';

/**
 * Stores enabled ui features in local storage, and shows
 */
export function init () {
  setFromQuery();
  displayNotification();
  return !!$location.search['ui_features'];
}

const store = TheStore.forKey('ui_features');

/**
 * Returns a comma-separated list of ui features enabled via query string param.
 */
export function getEnabledFeatures () {
  return store.get() || '';
}

function setFromQuery () {
  const features = $location.search()['ui_features'] || '';
  if (features !== getEnabledFeatures()) {
    store.set(features);
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
