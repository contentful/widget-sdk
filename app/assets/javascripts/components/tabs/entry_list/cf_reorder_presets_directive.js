'use strict';
angular.module('contentful').directive('cfReorderPresets', function(){
  return {
    link: function(scope, elem, attr){
      elem.sortable({
        axis: 'y',
        cancel: '.all-filter',
        cursor: 'move',
        disable: !scope.$eval(attr.cfReorderPresets),
        items: 'li',
        start: function (ev, ui) {
          ui.item.startIndex = ui.item.index();
        },
        update: function (ev, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index();
          delete ui.item.startIndex;
          scope.$apply(function(scope){
            var list = scope.uiConfig.entryListViews[0].views;
            list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
            scope.saveUiConfig();
          });
        }
      });

      scope.$watch(attr.cfReorderPresets, function (can) {
        elem.sortable(can ? 'enable' : 'disable');
      });
    }
  };
});
