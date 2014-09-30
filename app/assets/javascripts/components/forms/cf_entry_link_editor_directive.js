angular.module('contentful').directive('cfEntryLinkEditor', [function(){
  'use strict';

  return {
    restrict: 'A',
    template: JST['cf_entry_link_editor'],
    controller: 'EntryLinkEditorController'
  };
}]);

