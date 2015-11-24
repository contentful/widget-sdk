'use strict';


// This factory is used to load static assets
// It takes the file path relative to the root path - e.g. /path/to/asset
// Returns the full file path with the asset host specified by the environment

angular.module('contentful')
.factory('AssetLoader', ['$injector', function($injector) {

  var env = $injector.get('environment');

  return {
    getAssetUrl: function(file) {
      var assetHost = dotty.get(env, 'settings.asset_host');
      var prefix =  assetHost ? '//' + assetHost.replace(/\/*$/, '') : '';
      return prefix + '/' + file.replace(/^\/*/, '');
    }
  };

}]);
