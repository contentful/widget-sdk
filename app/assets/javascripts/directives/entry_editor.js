require([
  'angular',
  'directives',
  'templates/entry_editor'
], function(angular, directives, entryEditorTemplate){
  'use strict';

  directives.directive('entryEditor', function(){
    var entryEditorDirective = {
      template: entryEditorTemplate(),
      restrict: 'E',
      scope: {
        entry: '=entry'
      }
    };

    return entryEditorDirective;
  });
})
