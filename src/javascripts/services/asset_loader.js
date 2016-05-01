'use strict';


// This factory is used to load static assets
// It takes the file path relative to the root path - e.g. /path/to/asset
// Returns the full file path with the asset host specified by the environment

angular.module('contentful')
.factory('AssetLoader', ['$injector', function ($injector) {
  var env = $injector.get('environment');
  var manifest = env.manifest;
  var assetHost = env.settings.asset_host;
  var baseUrl = assetHost ? '//' + assetHost.replace(/\/*$/, '') : '';

  return {
    getAssetUrl: function (file) {
      file = manifest[file] || file;
      return baseUrl + '/' + file.replace(/^\/*/, '');
    }
  };
}]);
