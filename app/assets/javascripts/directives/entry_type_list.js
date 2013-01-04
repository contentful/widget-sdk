define([
  'angular',
  'templates/entry_type_list',

  'controllers/entry_type_list_controller'
], function(angular, entryTypeListTemplate){
  'use strict';

  return {
    name: 'entryTypeList',
    factory: function(){
      return {
        template: entryTypeListTemplate(),
        restrict: 'E',
        scope: {
          bucket: '=',
          tab: '='
          },
        controller: 'EntryTypeListCtrl',
      };
    }
  };

});

