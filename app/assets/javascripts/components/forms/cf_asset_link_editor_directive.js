angular.module('contentful').directive('cfAssetLinkEditor', [function(){
  'use strict';

  return {
    restrict: 'A',
    template: JST['cf_asset_link_editor'],
    controller: 'AssetLinkEditorController'
  };
}]);

