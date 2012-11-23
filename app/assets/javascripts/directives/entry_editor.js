define([
  'angular',
  'templates/entry_editor',

  'controllers/entry_editor_controller'
], function(angular, entryEditorTemplate){
  'use strict';

  return {
    name: 'entryEditor',
    factory: function(){
      return {
        template: entryEditorTemplate(),
        restrict: 'E',
        scope: {
          originalEntry: '=entry',
          entryType: '='
        },
        controller: 'EntryEditorCtrl'
      };
    }
  };

});
