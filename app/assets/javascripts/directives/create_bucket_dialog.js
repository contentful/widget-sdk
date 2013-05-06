angular.module('contentful/directives').directive('createBucketDialog', function (client) {
    'use strict';

    return {
      restrict: 'EC',
      scope: true,
      template: JST['create_bucket_dialog'](),
      controller: function createBucketDialogCtrl($scope) {
        function resetNewBucketData() {
          $scope.newBucketData = _.cloneDeep({defaultLocale: 'en-US'});
        }

        resetNewBucketData();

        $scope.createBucket = function () {
          var data = {name: $scope.newBucketData.name};
          if ($scope.newBucketData.defaultLocale)
            data.defaultLocale = $scope.newBucketData.defaultLocale;
          client.createBucket(data, function (err, newBucket) {
            console.log('new bucket', newBucket);
            $scope.performTokenLookup(function () {
              var bucket = _.find($scope.buckets, function (bucket) {
                return bucket.getId() == newBucket.getId();
              });
              $scope.selectBucket(bucket);
              $scope.hideCreateBucketDialog();
              resetNewBucketData();
            });
          });
        };
      },
      link: function (scope, elem) {
        //console.log('linking create bucket dialog');
        scope.$watch('displayCreateBucketDialog', function (display) {
          if (display) elem.find('input').eq(0).focus();
        });

        elem.on('keyup', function(e) {
          if (e.keyCode === 27) scope.$apply(scope.hideCreateBucketDialog());
        });
      }
    };
});
