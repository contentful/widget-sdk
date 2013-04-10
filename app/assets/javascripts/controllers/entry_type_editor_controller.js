'use strict';

angular.module('contentful/controllers').controller('EntryTypeEditorCtrl', function EntryTypeEditorCtrl($scope, ShareJS, availableFieldTypes) {
  $scope.availableTypes = availableFieldTypes;

  $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

  $scope.$watch('entryType', function(entryType){
    if (entryType) loadPublishedEntryType();
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  function loadPublishedEntryType() {
    // TODO use list in bucketcontext
    $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
      $scope.$apply(function(scope) {
        scope.publishedEntryType = publishedEntryType;
      });
    });
  }

  $scope.$watch('doc.snapshot.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('entryType.data.fields', function(fields, old, scope) {
    var availableFields = _(fields).filter(function(field) {
      return field.type === 'text' || field.type === 'string';
    }).sortBy('name').valueOf();

    if (!_.isEqual(scope.availableDisplayFields, availableFields)) {
      scope.availableDisplayFields = availableFields;
      //console.log('setting availablefields to %o  from %o ', availableFields, fields);
    }
  });

  $scope.displayFieldChanged = function() {
    console.log('display field changed', this.entryType.data.displayField);
    var scope = this;
    this.doc.setAt(['displayField'], this.entryType.data.displayField, function(err) {
      scope.$apply(function(scope) {
        if (err) {
          scope.entryType.data.displayField = scope.doc.snapshot.displayField;
        }
      });
    });
  };

  $scope.canPublish = function() {
    return !!$scope.doc;
  };

  $scope.delete = function () {
    // TODO get user confirmation
    $scope.entryType.delete(function (err) {
      if (!err) {
        $scope.$apply(function(scope) {
          scope.tab.close();
          scope.bucketContext.removeEntryType($scope.entryType);
        });
      } else {
        console.log('Error deleting entryType', $scope.entryType);
      }
    });
  };

  $scope.publish = function() {
    $scope.entryType.publish($scope.doc.version, function (err, publishedEntryType) {
      $scope.$apply(function(scope){
        if (err) {
          window.alert('could not publish');
        } else {
          scope.publishedEntryType = publishedEntryType;
        }
      });
      $scope.$broadcast('published');
      $scope.bucketContext.refreshEntryTypes($scope);
    });
  };

  $scope.headline = function(){
    var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
    return verb + ' Content Type';
  };

});
