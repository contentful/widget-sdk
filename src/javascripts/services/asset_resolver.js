'use strict';


angular.module('contentful')
/**
 * @ngdoc service
 * @module contentful
 * @name AssetResolver
 * @description
 * This service resolves URLs to assets that are built as part of the
 * location.
 *
 * It uses `environment.manifest` to get fingerprinted URLs for an
 * asset name. It is used exclusively by the `LazyLoader` service.
 * @usage[js]
 * var AssetResolver = require('AssetResolver')
 * AssetResolver.resolve('app/kaltura.js')
 * // '//static.contentful.com/app/kaltura-5x3jd.js'
 *
 */
.factory('AssetResolver', ['require', function (require) {
  var manifest = require('environment').manifest;

  return {
    resolve: function (file) {
      var resolved = manifest[file];
      if (!resolved) {
        throw new Error('Cannot resolve asset "' + file + '"');
      }

      return resolved;
    }
  };
}]);
