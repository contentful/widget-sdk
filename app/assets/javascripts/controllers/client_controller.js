define([
  'controllers',
  'lib/tab_list',
  'lodash',

  'services/client',
  'controllers/bucket_controller'
], function(controllers, TabList, _){
  'use strict';

  return controllers.controller('ClientCtrl', function($scope, client) {
    $scope.buckets = [];
    $scope.bucketContext = {
      bucket: null,
      entryTypes: [],
      refreshEntryTypes: function(scope) {
        var bucketContext = this;
        this.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
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

    $scope.tabList = new TabList($scope);

    $scope.$watch('buckets', function(buckets){
      if (buckets && buckets.length > 0) {
        if (!_.contains(buckets, $scope.bucketContext)) {
          $scope.bucketContext.bucket = buckets[0];
        }
      }
    });

    client.getBuckets({order: 'name'}, function(err, res){
      $scope.$apply(function($scope){
        $scope.buckets = res;
      });
    });

  });
});
