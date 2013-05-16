'use strict';

angular.module('contentful').directive('entryTypeEditor', function(){
  return {
    template: JST.entry_type_editor(),
    restrict: 'C',
    controller: 'EntryTypeEditorCtrl'
  };
});
