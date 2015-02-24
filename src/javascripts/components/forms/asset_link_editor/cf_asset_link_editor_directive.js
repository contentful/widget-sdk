'use strict';

angular.module('contentful').directive('cfAssetLinkEditor', [function(){
  return {
    restrict: 'A',
    template: JST['cf_asset_link_editor'],
    controller: 'AssetLinkEditorController'
  };
}]);

