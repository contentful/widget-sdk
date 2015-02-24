'use strict';

angular.module('contentful').directive('cfEntryCardEditor', [function(){
  return {
    restrict: 'A',
    template: JST['cf_entry_card_editor'],
    controller: 'EntryLinkEditorController',
    controllerAs: 'entryLinkController',
    scope: true
  };
}]);

