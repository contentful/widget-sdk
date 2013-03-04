angular.module('contentful/controllers').controller('ClientCtrl', function ClientCtrl($scope, client, BucketContext, authentication, QueryLinkResolver) {
  'use strict';

  $scope.buckets = [];
  $scope.bucketContext = new BucketContext($scope);

  $scope.user = null;

  $scope.selectBucket = function(bucket) {
    this.bucketContext.bucket = bucket;
  };

  $scope.$watch('buckets', function(buckets){
    if (buckets && buckets.length > 0) {
      if (!_.contains(buckets, $scope.bucketContext)) {
        $scope.bucketContext.bucket = buckets[0];
      }
    }
  });

  $scope.logout = function() {
    authentication.logout();
  };

  $scope.editProfile = function() {
    var options = {
      viewType: 'iframe',
      section: null,
      params: {
        url: authentication.profileUrl(),
        fullscreen: false
      },
      title: 'Edit Profile'
    };

    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });
    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };

  // TODO initialize blank user so that you can at least log out when
  // the getTokenLookup fails
  authentication.getTokenLookup(function(tokenLookup) {
    tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup)[0];
    $scope.$apply(function(scope) {
      scope.user = tokenLookup.user;
      scope.buckets = _.map(tokenLookup.buckets, function(bucketData) {
        return client.wrapBucket(bucketData);
      });
    });
  });

  //client.getBuckets({order: 'name'}, function(err, res){
    //$scope.$apply(function($scope){
      //$scope.buckets = res;
    //});
  //});
});
