'use strict';

angular.module('contentful').directive('cfAssetList', function(){
  return {
    template: JST.asset_list(),
    restrict: 'A',
    controller: 'AssetListController'
  };
});
