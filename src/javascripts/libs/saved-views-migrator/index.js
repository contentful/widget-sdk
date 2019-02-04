const { clone, cloneDeep, extend, omit, pick } = require('lodash');
const assetContentType = require('./asset-content-type');
const textQueryConverter = require('./text-query-converter');

const EMPTY_SEARCH = { searchText: '', searchFilters: [] };

module.exports = {
  create
};

/**
 * @param {ContentTypes} Array<ContentType>
 * @param {getAllUsers} Function Promise<User[]>
 * @returns {ViewMigrator}
 */
function create(contentTypes, getAllUsers) {
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
  function migrateUIConfigViews(uiConfig) {
    const migratedUIConfig = clone(uiConfig);
    const { entryListViews, assetListViews } = uiConfig;
    return Promise.all([
      Promise.all((entryListViews || []).map(folder => this.migrateViewsFolder(folder))),
      Promise.all((assetListViews || []).map(folder => this.migrateViewsFolder(folder, true)))
    ]).then(([migratedEntryListViews, migratedAssetListViews]) => {
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
  function migrateViewsFolder(folder, isAssetsFolder = false) {
    return Promise.all(
      (folder.views || []).map(view => {
        return this.migrateView(view, isAssetsFolder);
      })
    ).then(views => extend({}, folder, { views }));
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
  function migrateView(view, isAssetsView = false) {
    const searchTerm = view.searchTerm;
    const viewClone = cloneDeep(view);

    if (searchTerm) {
      const contentType = getViewContentTypeOrNull(view.contentTypeId);
      try {
        return textQueryConverter
          .textQueryToUISearch(contentType, searchTerm, getAllUsers)
          .then(updateViewWithSearch.bind(null, viewClone), handleTextQueryConverterError);
      } catch (error) {
        return handleTextQueryConverterError(error);
      }
    } else {
      return Promise.resolve(view);
    }

    function handleTextQueryConverterError() {
      const view = updateViewWithSearch(viewClone, EMPTY_SEARCH);
      view._legacySearchTerm = searchTerm;
      return Promise.resolve(view);
    }

    function getViewContentTypeOrNull(contentTypeId) {
      if (isAssetsView) {
        return assetContentType;
      }

      return contentTypeId ? contentTypes[contentTypeId] : null;
    }
  }
}

function updateViewWithSearch(view, search) {
  return extend(omit(view, ['searchTerm']), pick(search, ['searchText', 'searchFilters']));
}
