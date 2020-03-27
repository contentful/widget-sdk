const { cloneDeep, omit, pick } = require('lodash');
const textQueryConverter = require('./text-query-converter');

const EMPTY_SEARCH = { searchText: '', searchFilters: [] };

const ASSET_CONTENT_TYPE = {
  sys: { type: 'AssetContentType' },
  fields: [
    { id: 'title', type: 'Symbol' },
    { id: 'description', type: 'Text' },
    { id: 'file', type: 'File' },
  ],
};

module.exports = { create };

// contentTypeMap is a map of ID to bare API ContentType entities.
function create(contentTypeMap) {
  return {
    migrateUIConfigViews,
    migrateViewsFolder,
    migrateView,
  };

  function migrateUIConfigViews(uiConfig) {
    const migratedUIConfig = cloneDeep(uiConfig);
    const { entryListViews, assetListViews } = uiConfig;

    if (Array.isArray(entryListViews)) {
      migratedUIConfig.entryListViews = entryListViews.map((folder) => {
        return this.migrateViewsFolder(folder);
      });
    }

    if (Array.isArray(assetListViews)) {
      migratedUIConfig.assetListViews = assetListViews.map((folder) => {
        return this.migrateViewsFolder(folder, true);
      });
    }

    return migratedUIConfig;
  }

  function migrateViewsFolder(folder, isAssetsFolder = false) {
    return {
      ...folder,
      views: (folder.views || []).map((view) => this.migrateView(view, isAssetsFolder)),
    };
  }

  /**
   * Returns migrated view object or the same view object as passed in if no
   * migration is required.
   *
   * If the view can not be migrated for some unknown reason then an error gets
   * logged and we return a view with an empty search and a `_legacySearchTerm`
   * property set to the old `searchTerm` value.
   */
  function migrateView(view, isAssetsView = false) {
    const searchTerm = view.searchTerm;
    const viewClone = cloneDeep(view);

    if (!searchTerm) {
      return view;
    }

    const contentType = getViewContentTypeOrNull(view.contentTypeId);

    try {
      const search = textQueryConverter.textQueryToUISearch(contentType, searchTerm);
      return updateViewWithSearch(viewClone, search);
    } catch (error) {
      return handleTextQueryConverterError(error);
    }

    function handleTextQueryConverterError() {
      const view = updateViewWithSearch(viewClone, EMPTY_SEARCH);
      view._legacySearchTerm = searchTerm;
      return view;
    }

    function getViewContentTypeOrNull(contentTypeId) {
      if (isAssetsView) {
        return ASSET_CONTENT_TYPE;
      } else {
        return contentTypeId ? contentTypeMap[contentTypeId] : null;
      }
    }
  }
}

function updateViewWithSearch(view, search) {
  return {
    ...omit(view, ['searchTerm']),
    ...pick(search, ['searchText', 'searchFilters']),
  };
}
