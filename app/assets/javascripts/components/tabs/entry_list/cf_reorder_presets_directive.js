'use strict';
angular.module('contentful').directive('cfReorderPresets', function(){
  return {
    link: function(scope, elem){
      elem.sortable({
        axis: 'y',
        cancel: '.all-filter',
        cursor: 'move',
        items: 'li',
        start: function (ev, ui) {
          ui.item.startIndex = ui.item.index();
        },
        update: function (ev, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index();
          delete ui.item.startIndex;
          scope.$apply(function(scope){
            var list = scope.uiConfig.savedPresets;
            list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
            scope.saveUiConfig();
          });
        }
      });

    }
  };
});
