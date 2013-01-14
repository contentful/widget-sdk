'use strict';

angular.module('contentful/directives').directive('entryTypeEditor', function(){
  return {
    template: JST.entry_type_editor(),
    restrict: 'E',
    scope: {
      tab: '=',
      bucketContext: '='
    },
    controller: 'EntryTypeEditorCtrl'
  };
});
