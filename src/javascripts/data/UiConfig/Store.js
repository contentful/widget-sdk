import * as Defaults from './Defaults';
import { findIndex, get as getPath, extend, omit, pick, isEmpty } from 'lodash';
import { update, concat } from 'utils/Collections';
import { deepFreeze } from 'utils/Freeze';
import * as logger from 'services/logger';
import { USER_UI_CONFIG, getAlphaHeader } from 'alphaHeaders.js';

const SHARED_VIEWS = 'shared';
const PRIVATE_VIEWS = 'private';

const ENTRY_VIEWS_KEY = 'entryListViews';
const ASSET_VIEWS_KEY = 'assetListViews';

const ALPHA_HEADER = getAlphaHeader(USER_UI_CONFIG);

/**
 * This module exports a factory for UI config stores (shared and private).
 *
 * The store fetches UI config and sends changes back to the API. It is created
 * on the space context reset and available as `spaceContext.uiConfig`.
 *
 * @param {Space} space
 * @param {Endpoint} spaceEndpoint
 * @param {ContentTypeRepo} publishedCTs
 * @param {ViewMigrator} viewMigrator
 * @returns {Promise<UIConfigStore>}
 */
export default function create(space, spaceEndpoint$q, publishedCTs, viewMigrator) {
  const membership = space.data.spaceMember;
  const userId = membership.sys.user.sys.id;
  const getPrivateViewsDefaults = () => Defaults.getPrivateViews(userId);
  const getEntryViewsDefaults = () => Defaults.getEntryViews(publishedCTs.getAllBare());

  // TODO: `spaceEndpoint` is implemented with `$q` and other modules rely
  // on it. Wrapping with a native `Promise` for the time being.
  const spaceEndpoint = (...args) =>
    new Promise((resolve, reject) => {
      spaceEndpoint$q(...args).then(resolve, reject);
    });

  // State has two properties: [SHARED_VIEWS] and [PRIVATE_VIEWS].
  // Each property holds the server resource or `{}` if the resource
  // does not exist. Values are always deeply frozen. Use `setUiConfig`
  // to alter the value.
  const state = {};
  setUiConfig(SHARED_VIEWS, {});
  setUiConfig(PRIVATE_VIEWS, {});

  const api = deepFreeze({
    addOrEditCt,
    addToDefault,
    entries: {
      shared: forScope(SHARED_VIEWS, ENTRY_VIEWS_KEY, getEntryViewsDefaults, membership.admin),
      private: forScope(PRIVATE_VIEWS, ENTRY_VIEWS_KEY, getPrivateViewsDefaults, true),
    },
    assets: {
      shared: forScope(SHARED_VIEWS, ASSET_VIEWS_KEY, Defaults.getAssetViews, membership.admin),
      private: forScope(PRIVATE_VIEWS, ASSET_VIEWS_KEY, getPrivateViewsDefaults, true),
    },
  });

  return api;

  async function initializeIfNeeded(type) {
    if ((type === SHARED_VIEWS || type === PRIVATE_VIEWS) && isEmpty(state[type])) {
      await load(type);
    }
  }

  /**
   * Create a scoped store for a property on the root UI config.
   *
   * The scoped store gets and saves only the `key` part of the root object.
   * If the scoped value is not set we use `getDefaults()` to return a default.
   */
  function forScope(type, key, getDefaults, canEdit) {
    async function get() {
      await initializeIfNeeded(type);
      const currentState = state[type][key];
      if (!currentState) {
        return set(getDefaults());
      }
      return currentState;
    }

    async function set(val) {
      await initializeIfNeeded(type);
      await save(
        type,
        update(state[type], key, () => val)
      );
      return get();
    }

    return { get, set, canEdit };
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
  function load(type) {
    return spaceEndpoint(
      {
        method: 'GET',
        path: getEndpointPath(type),
      },
      getEndpointHeaders(type)
    ).then(
      (remoteData) => setUiConfigOrMigrate(type, remoteData),
      (error) => {
        const statusCode = getPath(error, 'statusCode');
        if (statusCode === 404) {
          return setUiConfig(type, {});
        } else {
          logger.logServerWarn(`Could not load ${getEntityName(type)}`, { error });
          return Promise.reject(error);
        }
      }
    );
  }

  function setUiConfigOrMigrate(type, data) {
    if (isUIConfigDataMigrated(data)) {
      const uiConfig = normalizeMigratedUIConfigData(data);
      return setUiConfig(type, uiConfig);
    } else {
      const migratedUIConfig = viewMigrator.migrateUIConfigViews(data);
      return setUiConfig(type, migratedUIConfig);
    }
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
  function save(type, uiConfig) {
    const config = setUiConfig(type, uiConfig);

    const data = prepareUIConfigForStorage(uiConfig);
    return spaceEndpoint(
      {
        method: 'PUT',
        path: getEndpointPath(type),
        version: getPath(data, ['sys', 'version']),
        data,
      },
      getEndpointHeaders(type)
    ).then(
      (remoteData) => {
        return setUiConfigOrMigrate(type, remoteData);
      },
      (error) => {
        const statusCode = getPath(error, 'statusCode');
        if (statusCode === 403) {
          return config;
        } else {
          const reject = () => Promise.reject(error);
          logger.logServerWarn(`Could not save ${getEntityName(type)}`, { error });
          return load(type).then(reject, reject);
        }
      }
    );
  }

  function getEndpointPath(type) {
    return ['ui_config'].concat(type === PRIVATE_VIEWS ? ['me'] : []);
  }

  function getEndpointHeaders(type) {
    return type === PRIVATE_VIEWS ? ALPHA_HEADER : {};
  }

  function getEntityName(type) {
    return `${type === PRIVATE_VIEWS ? 'User' : ''}UIConfig`;
  }

  function setUiConfig(type, data) {
    state[type] = deepFreeze(data);
    return state[type];
  }

  /**
   * @ngdoc method
   * @name uiConfig#addOrEditCt
   * @param {Client.ContentType} ct
   * @returns {Promise<object>}
   *
   * @description
   * Adds new content type under the "Content Type" folder or updates its title
   * if it already exists. This method is called only from the content type
   * editor. It expects content type data object, not @contentful/client entity.
   */
  async function addOrEditCt(ct) {
    await initializeIfNeeded(SHARED_VIEWS);
    const { folder, folderIndex, folderExists } = findFolder((f) => f.title === 'Content Type');
    const canEdit = membership.admin;

    if (folderExists && canEdit) {
      const { viewIndex, viewExists } = findCtViewIndex(folder, ct);
      if (viewExists) {
        return updateCtView(folderIndex, viewIndex, ct);
      } else {
        return createViewInFolder(folderIndex, Defaults.createContentTypeView(ct.sys.id, ct.name));
      }
    } else {
      // Nothing was updated but we don't fail.
      return state[SHARED_VIEWS];
    }
  }

  function addToDefault(view) {
    const { folderIndex, folderExists } = findFolder((f) => f.id === 'default');
    const canEdit = membership.admin;

    if (folderExists && canEdit) {
      return createViewInFolder(folderIndex, view);
    } else {
      // Nothing was updated but we don't fail.
      return Promise.resolve(state[SHARED_VIEWS]);
    }
  }

  function findFolder(predicate) {
    const folders = getPath(state, [SHARED_VIEWS, ENTRY_VIEWS_KEY], []);
    const index = findIndex(folders, predicate);

    return { folder: folders[index], folderIndex: index, folderExists: index > -1 };
  }

  function findCtViewIndex({ views }, ct) {
    const index = findIndex(views, (view) => {
      // There are folders containing `null`/`undefined`
      return view && view.contentTypeId === ct.sys.id;
    });

    return { viewIndex: index, viewExists: index > -1 };
  }

  function updateCtView(folderIndex, viewIndex, ct) {
    const path = [ENTRY_VIEWS_KEY, folderIndex, 'views', viewIndex, 'title'];
    const updated = update(state[SHARED_VIEWS], path, () => ct.name);

    return save(SHARED_VIEWS, updated);
  }

  function createViewInFolder(folderIndex, view) {
    const path = [ENTRY_VIEWS_KEY, folderIndex, 'views'];
    const updated = update(state[SHARED_VIEWS], path, (views) => concat(views, [view]));

    return save(SHARED_VIEWS, updated);
  }
}

/**
 * Returns whether given UIConfig data from storage is migrated.
 *
 * Note: Does NOT take an UIConfig and check whether the actual views are migrated.
 *
 * @param {Object} uiConfig
 * @returns {boolean}
 */
function isUIConfigDataMigrated(data) {
  if (data._migrated) {
    return true;
  }
  // Empty UIConfig counts as migrated. This is important as all ui_config/me/ return
  // an empty config instead of a 404 like ui_config/
  return Object.keys(data).length === 1 && !!data.sys;
}

/**
 * Turns migrated UIConfig data from storage into a UIConfig without the `_migrated`
 * field.
 *
 * @param {Object} migratedUIConfig
 * @returns {UIConfig}
 */
function normalizeMigratedUIConfigData(data) {
  const uiConfig = extend({}, data, data._migrated);
  delete uiConfig._migrated;
  return uiConfig;
}

/**
 * Moves migrated UIConfig parts into `_migrated` field.
 *
 * @param {UIConfig} uiConfig
 * @returns {Object}
 */
function prepareUIConfigForStorage(uiConfig) {
  const migrationFields = ['entryListViews', 'assetListViews'];
  const data = omit(uiConfig, migrationFields);
  data._migrated = pick(uiConfig, migrationFields);
  return data;
}
