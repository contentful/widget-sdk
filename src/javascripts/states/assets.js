'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['require', function (require) {
  var base = require('states/Base').default;
  var loadEditorData = require('app/entity_editor/DataLoader').loadAsset;
  var createAssetController = require('app/entity_editor/AssetController').default;

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading media...',
    template: '<div cf-asset-list class="workbench asset-list entity-list"></div>'
  });

  var detail = {
    name: 'detail',
    url: '/:assetId',
    params: { addToContext: true },
    resolve: {
      editorData: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
        return loadEditorData(spaceContext, $stateParams.assetId);
      }]
    },
    controller: ['$scope', 'editorData', createAssetController],
    template: JST.asset_editor()
  };

  return {
    name: 'assets',
    url: '/assets',
    abstract: true,
    children: [list, detail]
  };
}]);
