'use strict';

angular.module('contentful')
.factory('uiConfig', ['$injector', function ($injector) {

  var uiConfigDefaults = $injector.get('uiConfig/defaults');
  var $q = $injector.get('$q');
  var spaceContext = $injector.get('spaceContext');
  var logger = $injector.get('logger');

  var currentConfig = {};
  var isConfigSaved = false;

  return {
    load: load,
    save: save,
    addNewCt: addNewCt,
    resetEntries: resetEntries,
    resetAssets: resetAssets
  };

  function resetEntries (contentTypes) {
    var defaults = uiConfigDefaults.getEntryViews(contentTypes);
    currentConfig.entryListViews = defaults;
    return defaults;
  }

  function resetAssets () {
    var defaults = uiConfigDefaults.getAssetViews();
    currentConfig.assetListViews = defaults;
    return defaults;
  }

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

  function save (uiConfig) {
    return spaceContext.space.setUIConfig(uiConfig)
    .then(function (config) {
      currentConfig = config;
      return currentConfig;
    });
  }

  // If a new content type is created and there is a folder with the title
  // "Content Type" present, automatically add the new view here.
  // If there is no UI config set up yet, do nothing.
  function addNewCt (contentType) {
    if (!isConfigSaved) {
      return;
    }

    var contentTypeFolder = _.find(currentConfig.entryListViews, function (folder) {
      return folder.title === 'Content Type';
    });

    var viewExists = _.some(contentTypeFolder.views, function (view) {
      return view.title === contentType.data.name;
    });

    if (_.isArray(contentTypeFolder.views) && !viewExists) {
      var newView = uiConfigDefaults.createContentTypeView(contentType);
      contentTypeFolder.views.push(newView);
      return save(currentConfig);
    }
  }

}]);
