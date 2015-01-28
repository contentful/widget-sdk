'use strict';

angular.module('contentful').directive('cfMultiVideoEditor', [function(){
  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_multi_video_editor'](),
    controller : 'cfMultiVideoEditorController',
    controllerAs: 'multiVideoEditorController',
    link: function(scope, elem) {
      scope.videoInputController = videoInputController;

      if (scope.multiVideoEditor.isSortingEnabled)
        scope.linkSortOptions = {
          handle: '[cf-drag-handle]',
          cursor: 'move',
          forceHelperSize: true,
          forcePlaceholderSize: true,
          containment: 'document',
          tolerance: 'pointer',
          update: function(e, ui) {
            var oldIndex = ui.item.sortable.index;
            var newIndex = ui.item.sortable.dropindex;
            scope.otDoc.at(scope.otPath).move(oldIndex, newIndex);
          }
        };

        function videoInputController() {
          return elem.find('cf-video-input').controller('cfVideoInput');
        }
    }
  };
}]);
