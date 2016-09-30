'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var spaceContext = require('spaceContext');
  var $state = require('$state');

  var base = require('states/base');
  var loadEditorData = require('app/entity_editor/DataLoader').loadAsset;

  var listEntity = {
    getTitle: _.constant('Media'),
    link: { state: 'spaces.detail.assets.list' },
    getType: _.constant('Assets'),
    getId: _.constant('ASSETS')
  };

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading media...',
    controller: [function () {
      contextHistory.addEntity(listEntity);
    }],
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
    controller: ['$scope', 'editorData', function ($scope, editorData) {
      $state.current.data = $scope.context = {};
      $scope.editorData = editorData;

      // add list view as parent if it's a deep link to the media/asset
      if (contextHistory.isEmpty()) {
        contextHistory.addEntity(listEntity);
      }

      // add current state
      contextHistory.addEntity(buildAssetCrumb(editorData.entity));
    }],
    template: '<cf-asset-editor class="asset-editor workbench">'
  };

  return {
    name: 'assets',
    url: '/assets',
    abstract: true,
    children: [list, detail]
  };

  // TODO Will be removed in #1581. Duplicates code in states/entries
  function buildAssetCrumb (asset) {
    return {
      getTitle: function () {
        var asterisk = 'hasUnpublishedChanges' in asset && asset.hasUnpublishedChanges() ? '*' : '';
        return spaceContext.assetTitle(asset) + asterisk;
      },
      link: {
        state: 'spaces.detail.assets.detail',
        params: { assetId: asset.getId() }
      },
      getType: asset.getType.bind(asset),
      getId: _.constant(asset.getId())
    };
  }
}]);
