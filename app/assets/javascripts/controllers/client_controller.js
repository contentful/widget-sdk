angular.module('contentful/controllers').controller('ClientCtrl', function ClientCtrl($scope, client, BucketContext, authentication, contentfulClient) {
  'use strict';

  $scope.buckets = [];
  $scope.bucketContext = new BucketContext($scope);
  $scope.tokenIdentityMap = new contentfulClient.IdentityMap();

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

  $scope.$on('iframeMessage', function (event, message) {
    if (message.type === 'bucket' && message.action === 'update') {
      _.extend($scope.bucketContext.bucket.data, message.resource);
      //TODO this is pobably much too simplified, better look up correct
      //bucket and check if the method of updating is correct
    } else if (message.type === 'user' && message.action === 'update') {
      _.extend($scope.user, message.resource);
    /*
     * This does not work yet because when you mix relational databases and
     * object graphs you're gonna have a bad time, mkay?
     *
    } else if (message.action !== 'delete') {
      authentication.updateTokenLookup(message.resource);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateBuckets(authentication.tokenLookup.buckets);
    } else if (message.token) {
     */
      authentication.setTokenLookup(message.token);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateBuckets(authentication.tokenLookup.buckets);
    } else {
      $scope.performTokenLookup();
    }
    // TODO Better handle deletes (should also work somehow without message.token)
  });

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

    // TODO This is a pattern that repeats and should be extracted
    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });
    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };


  $scope.performTokenLookup = function () {
    // TODO initialize blank user so that you can at least log out when
    // the getTokenLookup fails
    authentication.getTokenLookup(function(tokenLookup) {
      $scope.$apply(function(scope) {
        scope.user = tokenLookup.sys.createdBy;
        scope.updateBuckets(tokenLookup.buckets);
      });
    });
  };

  $scope.updateBuckets = function (rawBuckets) {
    var newBucketList = _.map(rawBuckets, function (rawBucket) {
      var existing = _.find($scope.buckets, function (existingBucket) {
        return existingBucket.getId() == rawBucket.sys.id;
      });
      if (existing) {
        existing.update(rawBucket);
        return existing;
      } else {
        var bucket = client.wrapBucket(rawBucket);
        bucket.save = function () { throw new Error('Saving bucket not allowed'); };
        return bucket;
      }
    });
    newBucketList.sort(function (a,b) {
      return a.data.name.localeCompare(b.data.name);
    });
    $scope.buckets = newBucketList;
  };

  $scope.performTokenLookup();

  //client.getBuckets({order: 'name'}, function(err, res){
    //$scope.$apply(function($scope){
      //$scope.buckets = res;
    //});
  //});
});
