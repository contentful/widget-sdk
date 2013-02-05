'use strict';

angular.module('contentful/directives').directive('entryTypeList', function(){
  return {
    template: JST.entry_type_list(),
    restrict: 'C',
    scope: {
      bucketContext: '=',
      tab: '='
    },
    controller: 'EntryTypeListCtrl',
  };
});
