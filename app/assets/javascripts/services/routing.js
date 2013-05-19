'use strict';

angular.module('contentful').provider('routing', function ($routeProvider) {
  $routeProvider.when('/buckets/:bucketId/', {viewType: null});
  $routeProvider.when('/buckets/:bucketId/entries', {viewType: 'entry-list'});
  $routeProvider.when('/buckets/:bucketId/entries/:entryId', {viewType: 'entry-editor'});
  $routeProvider.when('/buckets/:bucketId/entry_types', {viewType: 'entry-type-list'});
  $routeProvider.when('/buckets/:bucketId/entry_types/:entryTypeId', {viewType: 'entry-type-editor'});
  $routeProvider.otherwise({bucketId: null});

  this.$get = function ($rootScope, $route, $location) {
    function Routing(){}

    Routing.prototype = {
      getRoute: function(){
        if(!$route.current) $route.reload();
        return $route.current;
      },

      getBucketId: function () {
        return this.getRoute().params.bucketId;
      },

      setBucket: function (bucket) {
        $location.path('/buckets/'+bucket.getId());
      },

      setTab: function (tab, bucket) {
        var bucketId = bucket ? bucket.getId() : this.getBucketId();
        var path = '/buckets/'+bucketId;
        if (tab.viewType == 'entry-editor') {
          path = path + '/entries/' + tab.params.entry.getId();
        } else if (tab.viewType == 'entry-list') {
          path = path + '/entries';
        } else if (tab.viewType == 'entry-type-editor') {
          path = path + '/entry_types/' + tab.params.entryType.getId();
        } else if (tab.viewType == 'entry-type-list') {
          path = path + '/entry_types';
        }
        $location.path(path);
      }
    };

    return new Routing();
  };
});
