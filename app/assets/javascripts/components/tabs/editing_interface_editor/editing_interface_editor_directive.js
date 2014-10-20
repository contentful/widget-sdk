'use strict';

angular.module('contentful').directive('editingInterfaceEditor', [function(){
  return {
    template: JST.editing_interface_editor(),
    restrict: 'C',
    controller: 'EditingInterfaceEditorController',
    link: function(scope){
      scope.widgetSortOptions = {
        //handle: '[cf-drag-handle]',
        forceHelperSize: true,
      };
    }
  };
}]);
