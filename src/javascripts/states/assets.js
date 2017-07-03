'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var $state = require('$state');
  var crumbFactory = require('navigation/CrumbFactory');

  var base = require('states/base');
  var loadEditorData = require('app/entity_editor/DataLoader').loadAsset;

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
    controller: ['$scope', 'editorData', function ($scope, editorData) {
      $state.current.data = $scope.context = {};
      $scope.editorData = editorData;

      // add list view as parent if it's a deep link to the media/asset
      if (contextHistory.isEmpty()) {
        contextHistory.add(crumbFactory.AssetList());
      }

      // add current state
      contextHistory.add(crumbFactory.Asset(editorData.entity.getSys(), $scope.context));
    }],
    template: '<cf-asset-editor class="asset-editor workbench">'
  };

  return {
    name: 'assets',
    url: '/assets',
    redirectTo: 'spaces.detail.assets.list',
    children: [list, detail]
  };
}]);
