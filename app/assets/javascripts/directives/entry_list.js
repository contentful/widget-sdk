define([
  'angular',
  'templates/entry_list'
], function(angular, entryListTemplate){
  'use strict';

  return {
    name: 'entryList',
    factory: function(){
      return {
        template: entryListTemplate(),
        restrict: 'E',
      };
    }
  };

});
