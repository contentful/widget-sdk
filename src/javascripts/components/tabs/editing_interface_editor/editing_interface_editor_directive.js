'use strict';

angular.module('contentful').directive('cfEditingInterfaceEditor', [function(){
  return {
    template: JST.editing_interface_editor(),
    restrict: 'A',
    controller: 'EditingInterfaceEditorController',
    controllerAs: 'editorController',
    link: function(scope){
      // Track received state in the directive because the state marker
      // is somehow removed by the jquery ui sortable component
      var sortableItemReceived = false;

      scope.widgetSortOptions = {
        disabled: !scope.editorController.layoutElementsEnabled,
        forceHelperSize: true,

        receive: function () {
          sortableItemReceived = true;
        },

        update: function (event, ui) {
          if(sortableItemReceived) {
            var dropIndex = ui.item.sortable.dropindex;
            var widgetId = ui.item.attr('data-layout-item');
            ui.item.remove();
            if(widgetId) {
              ui.item.sortable.received = true;
              scope.$apply(function () {
                scope.addStaticWidget(widgetId, dropIndex);
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
