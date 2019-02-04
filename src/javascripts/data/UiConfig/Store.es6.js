import * as Defaults from './Defaults.es6';
import { findIndex, get as getPath, extend, omit, pick } from 'lodash';
import { update, concat } from 'utils/Collections.es6';
import { deepFreeze } from 'utils/Freeze.es6';
import { getModule } from 'NgRegistry.es6';
import * as Telemetry from 'Telemetry.es6';

const logger = getModule('logger');

const SHARED_VIEWS = 'shared';
const PRIVATE_VIEWS = 'private';

const ENTRY_VIEWS_KEY = 'entryListViews';
const ASSET_VIEWS_KEY = 'assetListViews';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'user_ui_config' };

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
  const membership = space.data.spaceMembership;
  const userId = membership.user.sys.id;
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
    entries: {
      shared: forScope(SHARED_VIEWS, ENTRY_VIEWS_KEY, getEntryViewsDefaults, membership.admin),
      private: forScope(PRIVATE_VIEWS, ENTRY_VIEWS_KEY, getPrivateViewsDefaults, true)
    },
    assets: {
      shared: forScope(SHARED_VIEWS, ASSET_VIEWS_KEY, Defaults.getAssetViews, membership.admin),
      private: forScope(PRIVATE_VIEWS, ASSET_VIEWS_KEY, getPrivateViewsDefaults, true)
    }
  });

  return Promise.all([load(SHARED_VIEWS), load(PRIVATE_VIEWS)]).then(() => api);

  /**
   * Create a scoped store for a property on the root UI config.
   *
   * The scoped store gets and saves only the `key` part of the root object.
   * If the scoped value is not set we use `getDefaults()` to return a default.
   */
  function forScope(type, key, getDefaults, canEdit) {
    const get = () => (state[type][key] === undefined ? getDefaults() : state[type][key]);
    const set = val => save(type, update(state[type], key, () => val)).then(get);

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
        path: getEndpointPath(type)
      },
      getEndpointHeaders(type)
    ).then(
      remoteData => setUiConfigOrMigrate(type, remoteData),
      error => {
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
      Telemetry.count('uiconfig.migrated-fetched');
      const uiConfig = normalizeMigratedUIConfigData(data);
      return setUiConfig(type, uiConfig);
    } else {
      Telemetry.count('uiconfig.not-migrated-fetched');
      return viewMigrator.migrateUIConfigViews(data).then(migratedUIConfig => {
        return setUiConfig(type, migratedUIConfig);
      });
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
    setUiConfig(type, uiConfig);

    const data = prepareUIConfigForStorage(uiConfig);
    return spaceEndpoint(
      {
        method: 'PUT',
        path: getEndpointPath(type),
        version: getPath(data, ['sys', 'version']),
        data
      },
      getEndpointHeaders(type)
    ).then(
      remoteData => {
        return setUiConfigOrMigrate(type, remoteData);
      },
      error => {
        const reject = () => Promise.reject(error);
        logger.logServerWarn(`Could not save ${getEntityName(type)}`, { error });
        return load(type).then(reject, reject);
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
  function addOrEditCt(ct) {
    const { folder, folderIndex, folderExists } = findCtFolder();
    const canEdit = membership.admin;

    if (folderExists && canEdit) {
      const { viewIndex, viewExists } = findCtViewIndex(folder, ct);
      return viewExists ? updateCtView(folderIndex, viewIndex, ct) : createCtView(folderIndex, ct);
    } else {
      // Nothing was updated but the caller shouldn't know.
      return Promise.resolve(state[SHARED_VIEWS]);
    }
  }

  function findCtFolder() {
    const folders = getPath(state, [SHARED_VIEWS, ENTRY_VIEWS_KEY], []);
    const index = findIndex(folders, folder => folder.title === 'Content Type');

    return { folder: folders[index], folderIndex: index, folderExists: index > -1 };
  }

  function findCtViewIndex({ views }, ct) {
    const index = findIndex(views, view => {
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

  function createCtView(folderIndex, ct) {
    const path = [ENTRY_VIEWS_KEY, folderIndex, 'views'];
    const updated = update(state[SHARED_VIEWS], path, views => {
      return concat(views, [Defaults.createContentTypeView(ct)]);
    });

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
