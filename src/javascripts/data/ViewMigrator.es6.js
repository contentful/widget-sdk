import $q from '$q';
import {textQueryToUISearch} from 'search/TextQueryConverter';
import {clone, cloneDeep, extend, omit, pick} from 'lodash';
import assetContentType from 'assetContentType';
import logger from 'logger';

const EMPTY_SEARCH = { searchText: '', searchFilters: [] };

/**
 * @param {Space} space
 * @param {ContentTypesRepo} contentTypes
 * @returns {ViewMigrator}
 */
export default function create (space, contentTypes) {
  return {
    migrateUIConfigViews,
    migrateViewsFolder,
    migrateView
  };

  /**
   * Takes an uiConfig and returns a migrated version of it.
   *
   * @param {UIConfig} uiConfig
   * @returns {Promise<Object>}
   */
  function migrateUIConfigViews (uiConfig) {
    const migratedUIConfig = clone(uiConfig);
    const {entryListViews, assetListViews} = uiConfig;
    return $q.all([
      $q.all((entryListViews || []).map((folder) => this.migrateViewsFolder(folder))),
      $q.all((assetListViews || []).map(
        (folder) => this.migrateViewsFolder(folder, true)))
    ])
    .then(([migratedEntryListViews, migratedAssetListViews]) => {
      // Only set if not `undefined` initially. Don't even set to an empty array
      // because in this case default views won't be used.
      if (entryListViews) {
        migratedUIConfig.entryListViews = migratedEntryListViews;
      }
      if (assetListViews) {
        migratedUIConfig.assetListViews = migratedAssetListViews;
      }
      return migratedUIConfig;
    });
  }
  /**
   * Takes a folder of views and returns a copy of it with all views migrated.
   *
   * @param {object} folder
   * @param {boolean?} isAssetsFolder
   * @returns {Promise<Object>}
   */
  function migrateViewsFolder (folder, isAssetsFolder = false) {
    return $q.all((folder.views || []).map((view) => {
      return this.migrateView(view, isAssetsFolder);
    })).then((views) => extend({}, folder, {views}));
  }

  /**
   * Resolves with migrated view object or the same view object as passed in if no
   * migration is required.
   *
   * If the view can not be migrated for some unknown reason then an error gets
   * logged and we return a view with an empty search and a `_legacySearchTerm`
   * property set to the old `searchTerm` value.
   *
   * @param {Object} view
   * @param {boolean?} isAssetsView
   * @returns {Promise<Object>}
   */
  function migrateView (view, isAssetsView = false) {
    const searchTerm = view.searchTerm;
    const viewClone = cloneDeep(view);

    if (searchTerm) {
      const contentType = getViewContentTypeOrNull(view.contentTypeId);
      try {
        return textQueryToUISearch(space, contentType, searchTerm)
        .then(
          updateViewWithSearch.bind(null, viewClone),
          handleTextQueryConverterError);
      } catch (error) {
        return handleTextQueryConverterError(error);
      }
    } else {
      return $q.resolve(view);
    }

    function handleTextQueryConverterError (error) {
      const viewEntityType = isAssetsView ? 'Asset' : 'Entry';
      // If `msg` and `groupingHash` were the same, only one event would be saved by
      // bugsnag within a certain timeframe - even if `data` would be different!
      const msg = `Error migrating ${viewEntityType} view searchTerm: ${searchTerm}`;
      logger.logError(msg, {
        groupingHash: 'view-migration-error',
        error,
        data: {
          view: viewClone,
          viewEntityType,
          isUIConfigView: viewClone.title !== undefined
        }
      });
      const view = updateViewWithSearch(viewClone, EMPTY_SEARCH);
      view._legacySearchTerm = searchTerm;
      return $q.resolve(view);
    }

    function getViewContentTypeOrNull (contentTypeId) {
      if (isAssetsView) {
        return assetContentType;
      }
      return contentTypeId
        ? contentTypes.get(contentTypeId)
        : null;
    }
  }
}

function updateViewWithSearch (view, search) {
  return extend(
    omit(view, ['searchTerm']),
    pick(search, ['searchText', 'searchFilters']));
}

/**
 * Returns whether given UIConfig data from storage is migrated.
 *
 * Note: Does NOT take an UIConfig and check whether the actual views are migrated.
 *
 * @param {Object} uiConfig
 * @returns {boolean}
 */
export function isUIConfigDataMigrated (data) {
  return !!data._migrated;
}

/**
 * Turns migrated UIConfig data from storage into a UIConfig without the `_migrated`
 * field.
 *
 * @param {Object} migratedUIConfig
 * @returns {UIConfig}
 */
export function normalizeMigratedUIConfigData (data) {
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
export function prepareUIConfigForStorage (uiConfig) {
  const migrationFields = ['entryListViews', 'assetListViews'];
  const data = omit(uiConfig, migrationFields);
  data._migrated = pick(uiConfig, migrationFields);
  return data;
}
