define([
  'angular',
  'templates/bucket_entry_types',

  'controllers/bucket_entry_types_controller'
], function(angular, bucketEntryTypesTemplate){
  'use strict';

  return {
    name: 'bucketEntryTypes',
    factory: function(){
      return {
        template: bucketEntryTypesTemplate(),
        restrict: 'E',
        scope: {
          bucket: '=',
          tab: '='
          },
        controller: 'BucketEntryTypesCtrl',
      };
    }
  };

});

