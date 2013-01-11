define([
  'controllers',
  'lodash'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryTypeListCtrl', function($scope) {
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

    // TODO Use the global entryType list
    // TODO reload instead when an entryTypeEditor(mode==create) Tab is closed?
    $scope.$on('tabBecameActive', function(event, tab){
      var scope = event.currentScope;
      if (tab == scope.tab) {
        console.log('Reloading entryTypes');
        scope.reloadEntryTypes();
        scope.showLoadingIndicator = true;
        setTimeout(function() {
          console.log('Reloading entryTypes again');
          scope.reloadEntryTypes();
          scope.showLoadingIndicator = false;
        }, 3000);
      }
    });

    $scope.deleteEntryType = function (entryType) {
      entryType.delete(function (err) {
        if (!err) {
          $scope.$apply(function(scope) {
            var index = _.indexOf(scope.entryTypes, entryType);
            scope.entryTypes.splice(index, 1);
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

    $scope.$watch('bucketContext.bucket', 'reloadEntryTypes()');

    $scope.reloadEntryTypes = function(){
      var scope = this;
      if (this.bucketContext && this.bucketContext.bucket) {
        this.bucketContext.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes){
          if (err) return;
          scope.$apply(function(scope){
            scope.entryTypes = entryTypes;
          });
        });
      }
    };

  });
});
