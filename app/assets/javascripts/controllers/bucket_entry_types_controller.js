define([
  'controllers',
  'lodash'
], function(controllers, _){
  'use strict';

  return controllers.controller('BucketEntryTypesCtrl', function($scope) {

    $scope.createEntryType = function() {
      var entryType = this.bucket.createBlankEntryType();
      this.editEntryType(entryType, 'create');
    };

    $scope.editEntryType = function(entryType, mode) {
      if (mode === undefined) mode = 'edit';
      var editor = _(this.tab.list.items).find(function(tab){
        return (tab.viewType == 'entry-type-editor' && tab.params.entryType == entryType);
      });
      if (!editor) {
        editor = this.tab.list.add({
          viewType: 'entry-type-editor',
          section: 'entryTypes',
          params: {
            entryType: entryType,
            bucket: this.bucket,
            mode: mode
          },
          button: this.tab.button,
          title: (mode == 'edit' ? 'Edit Content Type' : 'New Content Type')
        });
      }
      editor.activate();
    };

    $scope.createEntryType = function() {
      var id = window.prompt('Please enter ID (only for development)');
      var name;
      if (!id || id === '') {
        id = null;
        name = 'Randomfoo';
      } else {
        name = id;
      }

      $scope.bucket.createEntryType({
        sys: {
          id: id
        },
        name: name
      }, function(err, entryType){
        if (!err) {
          $scope.$apply(function(scope){
            scope.editEntryType(entryType, 'create');
          });
        } else {
          console.log('Error creating entryType', err);
        }
      });
    };

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

    $scope.$on('tabButtonClicked', function(event, button){
      if (button == event.currentScope.tab.button) {
        event.currentScope.createEntryType();
      }
    });
    
    $scope.deleteEntryType = function (entryType) {
      window.alert('Not implemented server-side');
      return;
      entryType.delete(function (err) {
        if (!err) {
          this.reloadEntryTypes();
        } else {
          console.log('Error deleting entryType', entryType);
        }
      });
    };


    $scope.numFields = function(entryType) {
      return _(entryType.data.fields).size();
    };

    $scope.$watch('bucket', 'reloadEntryTypes()');

    $scope.reloadEntryTypes = function(){
      if ($scope.bucket) {
        $scope.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes){
          if (err) return;
          $scope.$apply(function($scope){
            $scope.entryTypes = entryTypes;
            $scope.tab.button.active=true;
          });
        });
      }
    };

  });
});
