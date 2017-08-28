import * as Defaults from './Defaults';
import $q from '$q';
import logger from 'logger';
import { find, findIndex, get as getPath } from 'lodash';

/**
 * This module exports a factory for the UiConfigStore.
 *
 * The store gets and updates the UiConfig and sends this changes to the API. It
 * is created on space context reset and avaialable as `spaceContext.uiConfig`.
 */
export default function create (spaceEndpoint, canEdit) {
  let currentConfig = {};
  let isConfigSaved = false;

  return {
    canEdit: canEdit,
    get: get,
    load: load,
    save: save,
    addOrEditCt: addOrEditCt,
    resetEntries: resetEntries,
    resetAssets: resetAssets
  };

  /**
   * @ngdoc method
   * @name uiConfig#resetEntries
   * @param {Array<object>} contentTypes
   * @returns {Array<object>}
   *
   * @description
   * Resets entries views to the default configuration.
   */
  function resetEntries (contentTypes) {
    const defaults = Defaults.getEntryViews(contentTypes);
    currentConfig.entryListViews = defaults;
    return defaults;
  }

  /**
   * @ngdoc method
   * @name uiConfig#resetAssets
   * @returns {Array}
   *
   * @description
   * Resets assets views to the default configuration.
   */
  function resetAssets () {
    const defaults = Defaults.getAssetViews();
    currentConfig.assetListViews = defaults;
    return defaults;
  }

  /**
   * @ngdoc method
   * @name uiConfig#get
   * @returns <object>
   *
   * @description
   * Returns the current UI config
   */
  function get () {
    return currentConfig;
  }

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
    }).then(function (config) {
      currentConfig = config;
      isConfigSaved = true;
      return config;
    }, function (err) {
      isConfigSaved = false;
      const statusCode = getPath(err, 'statusCode');
      if (statusCode === 404) {
        currentConfig = {};
        return currentConfig;
      }
      logger.logServerWarn('Could not load UIConfig', {error: err});
      return $q.reject(err);
    });
  }

  /**
   * @ngdoc method
   * @name uiConfig#save
   * @param {Array<object>} uiConfig
   * @returns {Promise<object>}
   *
   * @description
   * Saves the UiConfig provided and returns a promise that resolves to the config
   * object.
   */
  function save (uiConfig) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['ui_config'],
      version: getPath(currentConfig, ['sys', 'version']),
      data: uiConfig
    }).then(function (config) {
      currentConfig = config;
      return currentConfig;
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
   *
   * If there is no UI Config defined, do nothing.
   */
  function addOrEditCt (contentType) {
    if (!isConfigSaved) {
      return $q.resolve();
    }

    const contentTypeFolder = find(currentConfig.entryListViews, function (folder) {
      return folder.title === 'Content Type';
    });

    if (!contentTypeFolder) {
      return $q.resolve();
    }

    const viewIndex = findIndex(contentTypeFolder.views, function (view) {
      return view.contentTypeId === contentType.getId();
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

    return save(currentConfig);
  }
}
