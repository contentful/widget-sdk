require([
  'angular',
  'templates/entry_editor'
], function(angular, entryEditorTemplate){
  'use strict';

  return {
    name: 'entryEditor',
    factory: function(){
      return {
        template: entryEditorTemplate(),
        restrict: 'E',
        scope: {
          entry: '=entry'
        }
      };
    }
  };

});
