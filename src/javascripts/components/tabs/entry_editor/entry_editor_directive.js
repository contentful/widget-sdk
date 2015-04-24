'use strict';

angular.module('contentful').directive('cfEntryEditor', [function(){
  return {
    template: JST.entry_editor(),
    restrict: 'A',
    controller: 'EntryEditorController'
  };
}]);
