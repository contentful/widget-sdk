'use strict';

angular.module('contentful/controllers').controller('ClientCtrl', function ClientCtrl($scope, client) {
  $scope.buckets = [];
  $scope.bucketContext = {
    bucket: null,
    entryTypes: [],
    _entryTypesHash: {},
    refreshEntryTypes: function(scope) {
      var bucketContext = this;
      this.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
        if (err) return;
        scope.$apply(function() {
          bucketContext.entryTypes = entryTypes;
          bucketContext._entryTypesHash = _(entryTypes).map(function(et) {
            return [et.data.sys.id, et];
          }).object().valueOf();
        });
      });
    },
    removeEntryType: function(entryType) {
      var index = _.indexOf(this.entryTypes, entryType);
      this.entryTypes.splice(index, 1);
    },
    typeForEntry: function(entry) {
      return this._entryTypesHash[entry.data.sys.entryType];
    },
    entryTitle: function(entry) {
      try {
        var displayNameField = this.typeForEntry(entry).data.displayName;
        if (!displayNameField) {
          return entry.data.sys.id;
        } else {
          return entry.data.fields[displayNameField][this.bucket.data.locales.default];
        }
      } catch (e) {
        return entry.data.sys.id;
      }
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
