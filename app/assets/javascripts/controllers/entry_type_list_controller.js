'use strict';

angular.module('contentful/controllers').controller('EntryTypeListCtrl', function EntryTypeListCtrl($scope) {
  $scope.createEntryType = function() {
    var entryType = this.bucketContext.bucket.createBlankEntryType();
    this.editEntryType(entryType, 'create');
  };

  $scope.editEntryType = function(entryType) {
    var editor = _(this.tab.list.items).find(function(tab){
      return (tab.viewType == 'entry-type-editor' && tab.params.entryType == entryType);
    });
    if (!editor) {
      editor = this.tab.list.add({
        viewType: 'entry-type-editor',
        section: 'entryTypes',
        params: {
          entryType: entryType,
          mode: 'edit'
        },
        title: 'Edit Content Type'
      });
    }
    editor.activate();
  };

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
    if (entryType.data.sys.publishedAt) {
      return 'published';
    } else {
      return 'draft';
    }
  };

});
