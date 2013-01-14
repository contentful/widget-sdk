'use strict';

angular.module('contentful/directives').directive('entryList', function(){
  return {
    template: JST.entry_list(),
    restrict: 'E',
    scope: {
      bucketContext: '=',
      tab: '='
    },
    controller: 'EntryListCtrl',
  };
});
