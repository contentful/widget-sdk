'use strict';

angular.module('contentful').directive('entryEditor', function(){
  return {
    template: JST.entry_editor(),
    restrict: 'C',
    controller: 'EntryEditorCtrl'
  };
});
