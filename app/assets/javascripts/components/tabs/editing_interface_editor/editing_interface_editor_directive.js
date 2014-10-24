'use strict';

angular.module('contentful').directive('editingInterfaceEditor', [function(){
  return {
    template: JST.editing_interface_editor(),
    restrict: 'C',
    controller: 'EditingInterfaceEditorController',
    link: function(scope){
      // Track received state in the directive because the state marker
      // is somehow removed by the jquery ui sortable component
      var sortableItemReceived = false;

      scope.widgetSortOptions = {
        //handle: '[cf-drag-handle]',
        forceHelperSize: true,

        receive: function () {
          sortableItemReceived = true;
        },

        update: function (event, ui) {
          if(sortableItemReceived) {
            var dropIndex = ui.item.sortable.dropindex;
            var widgetType = ui.item.attr('data-layout-item');
            ui.item.remove();
            if(widgetType) {
              ui.item.sortable.received = true;
              scope.$apply(function () {
                scope.addLayoutItem(widgetType, dropIndex);
              });
            }
          }
        },

        stop: function () {
          sortableItemReceived = false;
        }
      };


      $('[data-layout-options] > *').draggable({
        connectToSortable: '[data-widget-settings]',
        helper: 'clone'
      });
    }
  };
}]);
