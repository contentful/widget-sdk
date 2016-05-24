'use strict';

angular.module('contentful').directive('cfEntryCardEditor', [function(){
  return {
    restrict: 'A',
    template: JST['cf_entry_card_editor'],
    controller: 'EntityLinkEditorController',
    controllerAs: 'entryLinkController',
    scope: true
  };
}]);
