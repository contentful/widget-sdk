define([
  'controllers',
  'lodash',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryTypeEditorCtrl', function($scope, ShareJS) {
    $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');


    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };

    $scope.entryTypePersisted = function() {
      return !!this.entryType.getId();
    };

    //$scope.$on('inputBlurred', function(event) {
      //event.stopPropagation();
      //event.currentScope.updateFromShareJSDoc();
    //});
    $scope.initialId = {
      value: null,
      error: false,
      pending: false,

      update: function(scope) {
        if (this.value === null || this.value === ''){
          this.error = false;
        } else if (!this.value.match(/^[\w\d]+$/i)) {
          this.error = 'Invalid Format';
        } else {
          this.checkIdInUse(scope);
        }
      },

      checkIdInUse: _.debounce(function(scope) {
        if (this.pending) return;
        var initialId = this;
        initialId.pending = true;
        scope.tab.params.bucket.getEntryType(this.value, function(err) {
          scope.$apply(function() {
            if (err) {
              initialId.error = false;
            } else {
              initialId.error = 'Already in use';
            }
            initialId.pending = false;
          });
        });
      }, 700),
    };

    $scope.$watch('initialId.value', function(value, old, scope) {
      console.log('Update', value, scope);
      scope.initialId.update(scope);
    });

    $scope.createWithId = function(id) {
      var scope = this;
      var bucket = this.tab.params.bucket;
      bucket.createEntryType({sys: {id: id}}, function(err, entryType) {
        if (err) {
          console.log('Error creating entryType from id', id, err);
        } else {
          // TODO This MUST be encapsulated in the client library
          // somehow. 1) Method for identitymapped objects & 2) in a
          // private callback in the save method of the objects
          // (although we're using create here instead)
          scope.$apply(function(scope) {
            scope.entryType.writeBack(entryType);
            scope.entryType.persistenceContext.identityMap.entryType[entryType.getId()] = scope.entryType;
            scope.entryType = entryType;
          });
        }
      });
    };

    $scope.updateFromShareJSDoc = function() {
      this.entryType.update(this.doc.value());
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' Content Type';
    };

  });
});

