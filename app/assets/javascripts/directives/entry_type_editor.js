define([
  'angular',
  'templates/entry_type_editor',

  'controllers/entry_type_editor_controller'
], function(angular, entryTypeEditorTemplate){
  'use strict';

  return {
    name: 'entryTypeEditor',
    factory: function(){
      return {
        template: entryTypeEditorTemplate(),
        restrict: 'E',
        scope: {
          tab: '=',
          bucketContext: '='
        },
        controller: 'EntryTypeEditorCtrl'
      };
    }
  };

});

