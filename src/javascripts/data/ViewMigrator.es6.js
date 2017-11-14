import $q from '$q';
import {textQueryToUISearch} from 'search/TextQueryConverter';
import {clone, cloneDeep, extend, omit, pick} from 'lodash';
import assetContentType from 'assetContentType';

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
      $q.all((entryListViews || []).map(this.migrateViewsFolder)),
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
  function migrateViewsFolder (folder, isAssetsFolder) {
    return $q.all((folder.views || []).map((view) => {
      return this.migrateView(view, isAssetsFolder);
    })).then((views) => extend({}, folder, {views}));
  }

  /**
   * Resolves with migrated View object or the same view object as passed in if no
   * migration is required.
   *
   * @param {Object} view
   * @param {boolean} isAssetsView
   * @returns {Promise<Object>}
   */
  function migrateView (view, isAssetsView) {
    if (view.searchTerm) {
      const contentType = getViewContentTypeOrNull(view.contentTypeId);
      const migratedView = cloneDeep(view);
      return textQueryToUISearch(space, contentType, view.searchTerm)
      .then((search) => {
        migratedView.searchText = search.searchText;
        migratedView.searchFilters = search.searchFilters;
        delete migratedView.searchTerm;
        return migratedView;
      });
    } else {
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

/**
 * Returns whether given UIConfig data from storage is migrated.
 *
 * Note: Does NOT take an UIConfig and check whether the actual views are migrated.
 *
 * @param uiConfig
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
 * @returns {Object}
 */
export function normalizeMigratedUIConfigData (data) {
  const uiConfig = extend({}, data, data._migrated);
  delete uiConfig._migrated;
  return uiConfig;
}

/**
 * Moves migrated UIConfig parts into `_migrated` field.
 *
 * @param uiConfig
 * @returns {*}
 */
export function prepareUIConfigForStorage (uiConfig) {
  const migrationFields = ['entryListViews', 'assetListViews'];
  const data = omit(uiConfig, migrationFields);
  data._migrated = pick(uiConfig, migrationFields);
  return data;
}
