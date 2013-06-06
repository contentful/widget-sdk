angular.module('contentful').controller('ClientCtrl', function ClientCtrl($scope, client, BucketContext, authentication, contentfulClient, notification, cfSpinner, analytics, routing) {
  'use strict';

  $scope.buckets = [];
  $scope.bucketContext = new BucketContext();
  $scope.tokenIdentityMap = new contentfulClient.IdentityMap();

  $scope.notification = notification;

  $scope.preferences = {
    showAuxPanel: false,

    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $scope.bucketContext.tabList.current);
    }
  };

  $scope.user = null;

  $scope.clickedBucketSwitcher = function () {
    analytics.track('Clicked Bucket-Switcher');
  };

  function setBucket(bucket) {
    analytics.setBucketData(bucket);
    $scope.bucketContext = new BucketContext(bucket);
  }

  $scope.getCurrentBucketId = function () {
    return $scope.bucketContext &&
           $scope.bucketContext.bucket &&
           $scope.bucketContext.bucket.getId();
  };

  $scope.selectBucket = function(bucket) {
    if (bucket && $scope.getCurrentBucketId() === bucket.getId()) return;
    
    setBucket(bucket);
    analytics.track('Switched Bucket', {
      bucketId: bucket.data.sys.id,
      bucketName: bucket.data.name
    });
  };

  $scope.$on('tabBecameActive', function (event, tab) {
    routing.setTab(tab, event.currentScope.bucketContext.bucket);
  });

  $scope.$on('$routeChangeSuccess', function (event, route) {
    if (route.noNavigate) return;
    if (route.params.bucketId != $scope.getCurrentBucketId()) {
      var bucket = _.find($scope.buckets, function (bucket) {
        return bucket.getId() == route.params.bucketId;
      });
      if (bucket) setBucket(bucket);
    }
  });

  $scope.$watch('buckets', function(buckets) {
    if (_.contains(buckets, $scope.bucketContext.bucket)) return;
    var bucketIdFromRoute = routing.getBucketId();
    var initialBucket = _.find(buckets, function (bucket) {
      return bucket.getId() == bucketIdFromRoute; }) || buckets[0];
    setBucket(initialBucket);
  });

  $scope.logout = function() {
    analytics.track('Clicked Logout');
    authentication.logout();
  };

  $scope.openSupport = function() {
    window.open(authentication.supportUrl());
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
    } else if (message.type === 'flash') {
      var level = message.resource.type;
      if (!level.match(/info|error/)) level = 'info';
      notification[level](message.resource.message);
    } else if (message.type === 'location') {
      // ignore
    } else {
      $scope.performTokenLookup();
    }
    // TODO Better handle deletes (should also work somehow without message.token)
  });

  $scope.clickedProfileButton = function () {
    analytics.track('Clicked Profile Button');
  };

  $scope.editProfile = function() {
    var options = {
      viewType: 'iframe',
      section: null,
      params: {
        url: authentication.profileUrl(),
        fullscreen: true
      },
      title: 'Profile'
    };

    analytics.track('Clicked Profile');

    // TODO This is a pattern that repeats and should be extracted
    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });
    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };


  $scope.performTokenLookup = function (callback) {
    // TODO initialize blank user so that you can at least log out when
    // the getTokenLookup fails
    var stopSpinner = cfSpinner.start();
    authentication.getTokenLookup(function(tokenLookup) {
      $scope.$apply(function(scope) {
        //console.log('tokenLookup', tokenLookup);
        scope.user = tokenLookup.sys.createdBy;
        analytics.login(scope.user);
        scope.updateBuckets(tokenLookup.buckets);
        if (callback) callback(tokenLookup);
      });
      stopSpinner();
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

  $scope.canCreateBucket = function () {
    // For now it is impossible to determine if this is allowed
    // TODO: Implement proper check as soon as the information is available
    return true;
  };

  $scope.showCreateBucketDialog = function () {
    $scope.displayCreateBucketDialog = true;
    analytics.track('Clicked Create-Bucket');
  };

  $scope.hideCreateBucketDialog = function () {
    $scope.displayCreateBucketDialog = false;
  };

  $scope.performTokenLookup();
});
