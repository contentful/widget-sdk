'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/assets
 */
.factory('states/assets', ['$injector', function ($injector) {
  var base = $injector.get('states/base');
  var filterDeletedLocales = $injector.get('states/entityLocaleFilter');

  var list = base({
    name: '.list',
    url: '',
    ncyBreadcrumb: {
      label: 'Media Library'
    },
    template: '<div cf-asset-list class="workbench asset-list entity-list"></div>'
  });

  var detail = {
    name: '.detail',
    url: '/:assetId',
    params: { addToContext: false },
    ncyBreadcrumb: {
      parent: 'spaces.detail.assets.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      asset: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getAsset($stateParams.assetId).then(function (asset) {
          filterDeletedLocales(asset.data, space.getPrivateLocales());
          return asset;
        });
      }],
      formControls: ['$injector', 'spaceContext', function ($injector, spaceContext) {
        var ei = $injector.get('data/editingInterfaces/asset');
        return spaceContext.widgets.buildRenderable(ei.widgets).form;
      }]
    },
    controller: ['$injector', '$scope', 'asset', 'formControls',
                 function ($injector, $scope, asset, formControls) {
      var $state = $injector.get('$state');
      $injector.get('contextHistory').addEntity(asset);
      $state.current.data = $scope.context = {};
      $scope.asset = $scope.entity = asset;
      $scope.formControls = formControls;
    }],
    template:
    '<div ' + [
      'cf-asset-editor',
      'class="asset-editor workbench"',
      'ot-doc-for="asset"',
      'cf-validate="asset.data"', 'cf-asset-schema',
      'ot-doc-presence',
    ].join(' ') + '></div>'
  };

  return {
    name: '.assets',
    url: '/assets',
    abstract: true,
    template: '<ui-view/>',
    children: [list, detail]
  };
}]);
