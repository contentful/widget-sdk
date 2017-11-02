import $window from '$window';
import $document from '$document';
import {h} from 'utils/hyperscript';
import TheStore from 'TheStore';
import {env} from 'environment';
import {uniq, without} from 'lodash';

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

function setFromQuery (value = '') {
  if (value.length > 0) {
    store.set(uniq(value.split(',')));
  }
}

function removeFeature (featureName) {
  const enabledFeatures = without(getEnabledFeatures(), featureName);
  store.set(enabledFeatures);
}

function displayNotification () {
  $document.find('body').append(renderNotification());

  $document.find('[data-cf-ui-feature-remove]').on('click', (el) => {
    const featureName = el.target.getAttribute('data-cf-ui-feature-remove');
    removeFeature(featureName);
    $window.location.reload();
  });
}

function renderNotification () {
  const features = getEnabledFeatures();
  if (!features.length) {
    return '';
  } else {
    const header = h('h5', {style: {margin: '8px 0'}}, ['Enabled features:']);

    const ul = h('ul', features.map(renderFeatureListItem));

    return h('.cf-ui-version-display', {
      style: {
        left: 0,
        right: 'auto'
      }
    }, [header, ul]);
  }
}

function renderFeatureListItem (feature) {
  const clearLink = h('a', {
    href: '#',
    dataCfUiFeatureRemove: feature,
    style: {float: 'right'}
  }, ['Clear']);
  return h('li', [feature, clearLink]);
}
