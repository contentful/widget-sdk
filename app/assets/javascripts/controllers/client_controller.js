define([
  'controllers',
  'lib/tab_list',
  'lodash',

  'services/client',
  'controllers/bucket_controller'
], function(controllers, TabList, _){
  'use strict';

  return controllers.controller('ClientCtrl', function($scope, client) {
    $scope.bucket  = null;
    $scope.buckets = [];
    $scope.bucketContext = {
      entryTypes: [],
      refreshEntryTypes: function(scope) {
        var bucket = scope.bucket;
        var bucketContext = this;
        bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
          if (err) return;
          scope.$apply(function() {
            bucketContext.entryTypes = entryTypes;
          });
        });
      }
    };

    $scope.$on('tabListButtonClicked', function(event, info) {
      // Otherwise the broadcast would trigger this handler -> endless loop
      if (event.targetScope === event.currentScope) return;
      event.currentScope.$broadcast('tabListButtonClicked', info);
    });

    // TODO move tablist into bucketContext
    $scope.tabList = new TabList($scope);

    $scope.$watch('buckets', function(buckets){
      if (buckets && buckets.length > 0) {
        $scope.bucket = buckets[0];
      }
    });

    client.getBuckets({order: 'name'}, function(err, res){
      $scope.$apply(function($scope){
        $scope.buckets = res;
      });
    });

  });
});
