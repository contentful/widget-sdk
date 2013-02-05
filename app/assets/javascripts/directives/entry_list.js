'use strict';

angular.module('contentful/directives').directive('entryList', function(){
  return {
    template: JST.entry_list(),
    restrict: 'C',
    scope: {
      bucketContext: '=',
      tab: '='
    },
    controller: 'EntryListCtrl',
  };
});
