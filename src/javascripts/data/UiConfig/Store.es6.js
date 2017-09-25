import * as Defaults from './Defaults';
import $q from '$q';
import logger from 'logger';
import { find, findIndex, get as getPath, cloneDeep } from 'lodash';
import * as K from 'utils/kefir';

/**
 * This module exports a factory for the UiConfigStore.
 *
 * The store gets and updates the UiConfig and sends this changes to the API. It
 * is created on space context reset and avaialable as `spaceContext.uiConfig`.
 */
// TODO this implementation relies heavily on mutation. We should
// rewrite it.
export default function create (spaceEndpoint, canEdit, publishedCTs) {
  const currentConfigRef = { value: {} };

  return {
    canEdit,
    // TODO Only used once when loading space. Make this part of the
    // factory
    load,
    addOrEditCt,
    forEntries: function () {
      const getDefaults = () => {
        // TODO We do not regenerate default views when a content types is changed
        // TODO do not use wrapped content types
        const contentTypes = K.getValue(publishedCTs.wrappedItems$).toJS();
        return Defaults.getEntryViews(contentTypes);
      };
      return forScope('entryListViews', getDefaults, currentConfigRef, save);
    },
    forAssets: function () {
      const getDefaults = Defaults.getAssetViews;
      return forScope('assetListViews', getDefaults, currentConfigRef, save);
    }
  };

  /**
   * @ngdoc method
   * @name uiConfig#load
   * @returns {Promise<object>}
   *
   * @description
   * Loads UI config from the server and returns a promise that resolves
   * to the config object.
   */
  function load () {
    return spaceEndpoint({
      method: 'GET',
      path: ['ui_config']
    }).then((config) => {
      currentConfigRef.value = config;
    }, (err) => {
      const statusCode = getPath(err, 'statusCode');
      if (statusCode === 404) {
        currentConfigRef.value = {};
      } else {
        logger.logServerWarn('Could not load UIConfig', {error: err});
        return $q.reject(err);
      }
    });
  }

  // TODO We should queue saves to prevent race conditions.
  function save (uiConfig) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['ui_config'],
      version: getPath(currentConfigRef.value, ['sys', 'version']),
      data: uiConfig
    }).then((config) => {
      currentConfigRef.value = config;
      return currentConfigRef.value;
    }, (err) => {
      load();
      return $q.reject(err);
    });
  }

  /**
   * @ngdoc method
   * @name uiConfig#addOrEditCt
   * @param {Object<Client.ContentType>} contentType
   * @returns {Promise<object>|undefined}
   *
   * @description
   * Adds new content type under the `Content Type` folder or updates its title if
   * it already exists.
   */
  function addOrEditCt (contentType) {
    const contentTypeFolder = find(currentConfigRef.value.entryListViews, (folder) => {
      return folder.title === 'Content Type';
    });

    if (!contentTypeFolder) {
      return $q.resolve();
    }

    const viewIndex = findIndex(contentTypeFolder.views, (view) => {
      return view.contentTypeId === contentType.data.sys.id;
    });

    const viewExists = viewIndex > -1;

    if (viewExists) {
      const view = contentTypeFolder.views[viewIndex];
      if (view.title) {
        view.title = contentType.data.name;
      }
    } else {
      const newView = Defaults.createContentTypeView(contentType);
      contentTypeFolder.views.push(newView);
    }

    return save(currentConfigRef.value);
  }
}


/**
 * Create a scoped UIConfig for a property on the root UI config.
 *
 * The scoped object gets and saves only the part of the root object
 * named by `prop`.
 *
 * If the scoped value is not set we use `getDefaults()` to return a default.
 */
function forScope (prop, getDefaults, configRef, saveConfig) {

  return {get, save};

  function get () {
    const config = configRef.value;
    if (!config[prop]) {
      config[prop] = getDefaults();
    }
    return config[prop];
  }

  function save (scopeValue) {
    // TODO no mutation. This service assumes it can mutate `configRef`:
    // clone deep so we're not storing references to frozen objects.
    configRef.value[prop] = cloneDeep(scopeValue);
    return saveConfig(configRef.value)
      .then(() => get());
  }
}
