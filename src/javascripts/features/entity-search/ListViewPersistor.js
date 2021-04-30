import qs from 'qs';
import { set, get } from 'lodash';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { omit } from 'lodash';
import { serialize, unserialize } from 'data/ViewSerializer';
import { getQueryString } from 'utils/location';
import { getBlankAssetView, getBlankEntryView } from 'data/UiConfig/Blanks';

const getLegacyStoreKey = (entityKey, spaceId) => {
  const LEGACY_STORE_PREFIX = 'lastFilterQueryString';
  return [LEGACY_STORE_PREFIX, entityKey, spaceId].join('.');
};

const getStoreKey = (entityKey, environmentId, spaceId) => {
  const STORE_PREFIX = 'cf_webapp_lastfilter';
  return [STORE_PREFIX, entityKey, environmentId, spaceId].join('_');
};

const getEntityKey = (entityType) => {
  const entityKey = { entry: 'entries', asset: 'assets' }[entityType.toLowerCase()];

  if (typeof entityKey === 'string') {
    return entityKey;
  }

  throw new Error(`Cannot create a view persistor for ${entityType}.`);
};

const getDefaults = (entityKey) =>
  entityKey === 'assets' ? getBlankAssetView() : getBlankEntryView();

const pickLegacyValue = (entityKey, spaceId) => {
  const legacyStoreKey = getLegacyStoreKey(entityKey, spaceId);
  const legacyStore = getBrowserStorage().forKey(legacyStoreKey);
  const result = legacyStore.get();
  legacyStore.remove();
  return result;
};

/**
 * Create a view persistor. Used on both entry and asset list.
 *
 * Views are persisted to the location query string and local storage.
 * They are also read from both with the query string taking
 * precedence.
 */

let initialized = false;

export function createListViewPersistor({ entityType, spaceId, environmentId }) {
  const entityKey = getEntityKey(entityType);
  const storeKey = getStoreKey(entityKey, environmentId, spaceId);
  const store = getBrowserStorage().forKey(storeKey);
  const defaults = getDefaults(entityKey);

  const legacyValue = pickLegacyValue(entityKey, spaceId);
  if (legacyValue) {
    store.set(legacyValue);
  }

  // initial load
  let view;
  if (!initialized) {
    initialized = true;
    view = read(getQueryString());
  } else {
    view = read();
  }
  save(view);

  return {
    read,
    readKey,
    readKeys,
    save,
    saveKey,
  };

  function saveKey(key, value) {
    const view = read();
    set(view, key.split('.'), value);
    save(view);
  }

  function save(view) {
    const viewData = serialize(omitUIConfigOnlyViewProperties(view));
    store.set(viewData);
    setContextView(prepareQueryObject(viewData));
  }

  function readKey(key) {
    const view = read();
    return get(view, key.split('.'));
  }

  function readKeys(keys) {
    const view = read();
    const results = {};
    keys.forEach((key) => {
      const path = key.split('.');
      const result = get(view, path);
      set(results, path, result);
    });
    return results;
  }

  function read(initial = {}) {
    const stored = store.get();
    // initial query string takes precedence over local storage takes precedence over defaults
    const viewData = { ...defaults, ...stored, ...initial };
    const view = omitUIConfigOnlyViewProperties(unserialize(viewData)) || {};
    return view;
  }
}

function setContextView(state) {
  window.history.pushState(state, '', prepareQueryString(state));
}

function omitUIConfigOnlyViewProperties(view) {
  return omit(view, ['title', '_legacySearchTerm']);
}

function prepareQueryObject(viewData) {
  return Object.keys(viewData)
    .filter((key) => !key.startsWith('_'))
    .reduce((acc, key) => ({ ...acc, [key]: viewData[key] }), {});
}

function prepareQueryString(viewData) {
  const qsObject = prepareQueryObject(viewData);

  // We use the "repeat" array format option so:
  // stringify({x: [1, 2]}) // results in: 'x=1&x=2'
  //
  // This format is used in entity list query strings
  // for historical reasons.
  return qs.stringify(qsObject, { arrayFormat: 'repeat', addQueryPrefix: true });
}

export const reset = () => (initialized = false);
