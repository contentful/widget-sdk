'use strict';

angular.module('contentful').directive('cfOoyalaMultiAssetEditor', [function(){

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_multi_asset_editor'](),
    controller : 'cfOoyalaMultiAssetEditorController',
    controllerAs: 'multiAssetEditorController',
    link: function(scope) {
      scope.linkSortOptions = {
        handle: '[cf-drag-handle]',
        cursor: 'move',
        forceHelperSize: true,
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        containment: 'document',
        update: function(e, ui) {
          var oldIndex = ui.item.sortable.index;
          var newIndex = ui.item.sortable.dropindex;
          scope.otDoc.at(scope.otPath).move(oldIndex, newIndex);
        }
      };
    }
  };

}]);

