'use strict';

angular.module('contentful').controller('EntryTypeListCtrl', function EntryTypeListCtrl($scope) {
  $scope.deleteEntryType = function (entryType) {
    entryType.delete(function (err) {
      if (!err) {
        $scope.$apply(function(scope) {
          scope.bucketContext.removeEntryType(entryType);
        });
      } else {
        console.log('Error deleting entryType', entryType);
      }
    });
  };

  $scope.numFields = function(entryType) {
    return _.size(entryType.data.fields);
  };

  $scope.reloadEntryTypes = function(){
    if (this.bucketContext) this.bucketContext.refreshEntryTypes();
  };

  $scope.statusClass = function(entryType) {
    return entryType.data.sys.publishedAt ? 'published' : 'draft';
  };

  $scope.statusLabel = function(entryType) {
    return entryType.data.sys.publishedAt ? 'active' : 'draft';
  };

  $scope.$watch('bucketContext.entryTypes', function(l) {
    $scope.empty = _.isEmpty(l);
  });

  $scope.$on('tabBecameActive', function(event, tab) {
    if (tab !== $scope.tab) return;
    $scope.reloadEntryTypes();
  });
});
