'use strict';

/**
 * @ngdoc service
 * @name uiConfig
 *
 * @description
 * This service exposes methods to load, update and save UI configuration.
 *
 * This is a stateful service. It holds the UI config for the current
 * space determined by 'spaceContext'. Loading a new UI config when the
 * space changes is done in the UiConfigController.
 *
 * TODO This service should not be stateful.
 */
angular.module('contentful')
.factory('uiConfig', ['$injector', function ($injector) {

  var uiConfigDefaults = $injector.get('uiConfig/defaults');
  var $q = $injector.get('$q');
  var spaceContext = $injector.get('spaceContext');
  var logger = $injector.get('logger');

  var currentConfig = {};
  var isConfigSaved = false;

  return {
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
    var defaults = uiConfigDefaults.getEntryViews(contentTypes);
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
    var defaults = uiConfigDefaults.getAssetViews();
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
    return spaceContext.space.getUIConfig()
    .then(function (config) {
      currentConfig = config;
      isConfigSaved = true;
      return config;
    }, function (err) {
      isConfigSaved = false;
      var statusCode = dotty.get(err, 'statusCode');
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
    return spaceContext.space.setUIConfig(uiConfig)
    .then(function (config) {
      currentConfig = config;
      return currentConfig;
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
      return;
    }

    var contentTypeFolder = _.find(currentConfig.entryListViews, function (folder) {
      return folder.title === 'Content Type';
    });

    if (!contentTypeFolder) {
      return;
    }

    var viewIndex = _.findIndex(contentTypeFolder.views, function (view) {
      return view.contentTypeId === contentType.getId();
    });

    var viewExists = viewIndex > -1;

    if (viewExists) {
      var view = contentTypeFolder.views[viewIndex];
      if (view.title) {
        view.title = contentType.data.name;
      }
    } else {
      var newView = uiConfigDefaults.createContentTypeView(contentType);
      contentTypeFolder.views.push(newView);
    }

    return save(currentConfig);

  }

}]);
