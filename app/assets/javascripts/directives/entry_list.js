define([
  'angular',
  'templates/entry_list',

  'controllers/entry_list_controller'
], function(angular, entryListTemplate){
  'use strict';

  return {
    name: 'entryList',
    factory: function(){
      return {
        template: entryListTemplate(),
        restrict: 'E',
        scope: {
          bucketContext: '=',
          tab: '='
        },
        controller: 'EntryListCtrl',
      };
    }
  };

});
