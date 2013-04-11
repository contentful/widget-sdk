'use strict';

angular.module('contentful/directives').directive('entryEditor', function(){
  return {
    template: JST.entry_editor(),
    restrict: 'C',
    scope: {
      tab: '=',
      bucketContext: '=',
      preferences: '='
    },
    controller: 'EntryEditorCtrl'
  };
});
