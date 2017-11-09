import $q from '$q';
import {textQueryToUISearch} from 'search/TextQueryConverter';
import {clone, cloneDeep, extend, has} from 'lodash';

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
    const {entryListViews = []} = uiConfig;
    return $q.all(
      entryListViews.map((folder) => this.migrateViewsFolder(folder))
    ).then((entryListViews) => extend({}, uiConfig, {entryListViews}));
  }
  /**
   * Takes a folder of views and returns a copy of it with all views migrated.
   *
   * @param folder
   * @returns {Promise<Object>}
   */
  function migrateViewsFolder (folder) {
    return $q.all((folder.views || []).map((view) => {
      return this.migrateView(view);
    })).then((views) => extend({}, folder, {views}));
  }

  /**
   * Resolves with migrated View object or the same view object as passed in if no
   * migration is required.
   *
   * @param {Object} view
   * @returns {Promise<Object>}
   */
  function migrateView (view) {
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
  }

  function getViewContentTypeOrNull (contentTypeId) {
    return contentTypeId
      ? contentTypes.get(contentTypeId)
      : null;
  }
}

/**
 * Returns whether given UIConfig data from storage is migrated.
 *
 * @param uiConfig
 * @returns {boolean}
 */
export function isUIConfigDataMigrated (data) {
  return has(data, '_migrated.entryListViews');
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
  const data = clone(uiConfig);
  const entryListViews = data.entryListViews;
  data._migrated = {entryListViews};
  delete data.entryListViews;
  return data;
}
