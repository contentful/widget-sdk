'use strict';

angular.module('contentful').directive('cfEntryLinkEditor', [function(){
  return {
    restrict: 'A',
    template: JST['cf_entry_link_editor'],
    controller: 'EntryLinkEditorController',
    controllerAs: 'entryLinkController'
  };
}]);

