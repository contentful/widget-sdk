'use strict';

angular.module('contentful').directive('cfAssetGalleryEditor', [function(){
  return {
    restrict: 'A',
    template: JST['cf_asset_gallery_editor'],
    controller: 'AssetLinkEditorController'
  };
}]);

