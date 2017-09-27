import * as Defaults from './Defaults';
import logger from 'logger';
import {findIndex, get as getPath} from 'lodash';
import {update, concat} from 'utils/Collections';
import {deepFreeze} from 'utils/Freeze';
import * as K from 'utils/kefir';
import TheStore from 'TheStore';

const ENTRY_VIEWS_KEY = 'entryListViews';
const ASSET_VIEWS_KEY = 'assetListViews';

/**
 * This module exports a factory for the UI config store.
 *
 * The store fetches UI config and sends changes back to the API. It is created
 * on the space context reset and available as `spaceContext.uiConfig`.
 */
export default function create ({endpoint, space}, canEdit, publishedCTs) {
  // Holds the server resource or `{}` if the resource does not exist.
  // The value is always deeply frozen. Use `setUiConfig` to alter the value.
  let uiConfig;
  setUiConfig({});

  const api = deepFreeze({
    addOrEditCt,
    entries: {
      shared: forScope(ENTRY_VIEWS_KEY, getEntryViewsDefaults),
      private: forPrivateScope(ENTRY_VIEWS_KEY)
    },
    assets: {
      shared: forScope(ASSET_VIEWS_KEY, Defaults.getAssetViews),
      private: forPrivateScope(ASSET_VIEWS_KEY)
    }
  });

  return load().then(() => api);

  /**
   * Create a scoped store for a property on the root UI config.
   *
   * The scoped store gets and saves only the `key` part of the root object.
   * If the scoped value is not set we use `getDefaults()` to return a default.
   */
  function forScope (key, getDefaults) {
    const get = () => uiConfig[key] === undefined ? getDefaults() : uiConfig[key];
    const set = val => save(update(uiConfig, key, () => val)).then(get);

    return {get, set, canEdit: {views: canEdit, folders: canEdit}};
  }

  function forPrivateScope (key) {
    const store = TheStore.forKey(`privateSavedViews.${space.data.sys.id}.${key}`);
    const getDefaults = () => Defaults.getPrivateViews(space.data.spaceMembership);

    const get = () => {
      const val = store.get();
      // localStorage, can be modified by a user
      if (Array.isArray(val)) {
        return val;
      } else {
        return getDefaults();
      }
    };

    const set = val => {
      if (val === undefined) {
        store.remove();
      } else {
        store.set(val);
      }

      return Promise.resolve(val);
    };

    return {get, set, canEdit: {views: true, folders: false}};
  }

  function getEntryViewsDefaults () {
    // TODO do not use wrapped content types
    const contentTypes = K.getValue(publishedCTs.wrappedItems$).toJS();
    return Defaults.getEntryViews(contentTypes);
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
    return endpoint({
      method: 'GET',
      path: ['ui_config']
    }).then(setUiConfig, error => {
      const statusCode = getPath(error, 'statusCode');
      if (statusCode === 404) {
        return setUiConfig({});
      } else {
        logger.logServerWarn('Could not load UIConfig', {error});
        return Promise.reject(error);
      }
    });
  }

  /**
   * @ngdoc method
   * @name uiConfig#save
   * @returns {Promise<object>}
   *
   * @description
   * Saves UI config to the server and returns a promise that resolves
   * to the saved config object. The local version is updated w/o waiting
   * for the API roundtrip to finish.
   *
   * TODO we should queue saves to prevent race conditions
   */
  function save (data) {
    setUiConfig(data);

    return endpoint({
      method: 'PUT',
      path: ['ui_config'],
      version: getPath(data, ['sys', 'version']),
      data
    }).then(setUiConfig, error => {
      const reject = () => Promise.reject(error);
      logger.logServerWarn('Could not save UIConfig', {error});
      return load().then(reject, reject);
    });
  }

  function setUiConfig (data) {
    uiConfig = deepFreeze(data);
    return uiConfig;
  }

  /**
   * @ngdoc method
   * @name uiConfig#addOrEditCt
   * @param {Client.ContentType} contentType
   * @returns {Promise<object>}
   *
   * @description
   * Adds new content type under the "Content Type" folder or updates its title
   * if it already exists. This method is called from the content type editor.
   */
  function addOrEditCt (contentType) {
    const folders = uiConfig[ENTRY_VIEWS_KEY];
    const ctFolderIndex = findIndex(folders, folder => {
      return folder.title === 'Content Type';
    });

    if (ctFolderIndex < 0 || !canEdit) {
      return Promise.resolve(uiConfig);
    }

    const ctFolder = folders[ctFolderIndex];
    const viewIndex = findIndex(ctFolder.views, view => {
      return view.contentTypeId === contentType.data.sys.id;
    });

    const viewExists = viewIndex > -1;

    if (viewExists) {
      const path = [ENTRY_VIEWS_KEY, ctFolderIndex, 'views', viewIndex, 'title'];
      return save(update(uiConfig, path, () => contentType.data.name));
    } else {
      const path = [ENTRY_VIEWS_KEY, ctFolderIndex, 'views'];
      const newView = Defaults.createContentTypeView(contentType);
      return save(update(uiConfig, path, views => concat(views, [newView])));
    }
  }
}
