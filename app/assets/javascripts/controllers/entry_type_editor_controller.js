'use strict';

angular.module('contentful/controllers').controller('EntryTypeEditorCtrl', function EntryTypeEditorCtrl($scope, ShareJS, availableFieldTypes) {
  $scope.availableTypes = availableFieldTypes;

  $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

  $scope.$watch('entryType', function(entryType, old, scope){
    if (!entryType) return;
    if (scope.shareJSstarted) {
      console.log('Fatal error, shareJS started twice');
    }

    loadPublishedEntryType();

    ShareJS.open(entryType, function(err, doc) {
      if (!err) {
        scope.$apply(function(scope){
          scope.doc = doc;
          scope.remoteOpListener = scope.doc.on('remoteop', function(op) {
            scope.$apply(function(scope) {
              scope.updateFromShareJSDoc();
              // TODO Also update the publishedEntryType if a publishing action was received
              // or there have been local changes
            });
          });
        });
      } else {
        console.log('Error opening connection', err);
      }
    });
    scope.shareJSstarted = true;
  });

  function loadPublishedEntryType() {
    $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
      $scope.$apply(function(scope) {
        scope.publishedEntryType = publishedEntryType;
      });
    });
  }

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
    if (!$scope.doc) return false;
    return true;
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

  $scope.publishedAt = function(){
    if (!$scope.doc) return;
    var val = $scope.doc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.publishedVersion = function() {
    if (!$scope.doc) return;
    return $scope.doc.getAt(['sys', 'publishedVersion']);
  };

  $scope.publish = function() {
    var version = $scope.doc.version;
    $scope.entryType.publish(version, function (err, publishedEntryType) {
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

  $scope.$on('$destroy', function(event) {
    var scope = event.currentScope;
    if (scope.remoteOpListener) {
      scope.doc.removeListener(scope.remoteOpListener);
      scope.remoteOpListener = null;
    }
    if (scope.tab.params.mode === 'create') {
      scope.bucketContext.refreshEntryTypes(scope);
    }
  });

  $scope.updateFromShareJSDoc = function() {
    var data = this.doc.snapshot;
    this.entryType.update(data);
  };

  $scope.headline = function(){
    var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
    return verb + ' Content Type';
  };

});
