'use strict';

angular.module('contentful').directive('entryTypeList', function(){
  return {
    template: JST.entry_type_list(),
    restrict: 'C',
    controller: 'EntryTypeListCtrl'
  };
});
