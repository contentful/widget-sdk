'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var spaceContext = require('spaceContext');

  var base = require('states/base');
  var filterDeletedLocales = require('states/entityLocaleFilter');

  var listEntity = {
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.assets.list' },
    getType: _.constant('Assets'),
    getId: _.constant('ASSETS')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Media',
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
    label: 'Asset details',
    resolve: {
      asset: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getAsset($stateParams.assetId).then(function (asset) {
          filterDeletedLocales(asset.data, space.getPrivateLocales());
          return asset;
        });
      }],
      formControls: ['spaceContext', function (spaceContext) {
        var ei = require('data/editingInterfaces/asset');
        return spaceContext.widgets.buildRenderable(ei.widgets).form;
      }]
    },
    controller: ['$scope', 'require', 'asset', 'formControls', function ($scope, require, asset, formControls) {
      var $state = require('$state');

      $state.current.data = $scope.context = {};
      $scope.asset = $scope.entity = asset;
      $scope.formControls = formControls;

      // TODO(mudit): Pluck this out into a service that accepts an entity
      // and returns the title and use it everywhere.
      // An entity can be Entry, Content Type, Asset, Webhook, Locale, Role, etc
      asset.getTitle = function () {
        var title = 'hasUnpublishedChanges' in asset && asset.hasUnpublishedChanges() ? '*' : '';

        return spaceContext.assetTitle(asset) + title;
      };

      // add list view as parent if it's a deep link to the media/asset
      if (contextHistory.isEmpty()) {
        contextHistory.addEntity(listEntity);
      }

      // add current state
      contextHistory.addEntity(asset);
    }],
    template:
    '<div ' + [
      'cf-asset-editor',
      'class="asset-editor workbench"',
      'cf-validate="asset.data"', 'cf-asset-schema'
    ].join(' ') + '></div>'
  };

  return {
    name: 'assets',
    url: '/assets',
    abstract: true,
    template: '<ui-view/>',
    children: [list, detail]
  };
}]);
