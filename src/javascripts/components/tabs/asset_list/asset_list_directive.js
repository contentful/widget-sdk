'use strict';

angular.module('contentful').directive('cfAssetList', () => ({
  template: JST.asset_list(),
  restrict: 'A',
  controller: 'AssetListController'
}));
