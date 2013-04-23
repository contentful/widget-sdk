'use strict';

angular.module('contentful/controllers').controller('EntryTypeEditorCtrl', function EntryTypeEditorCtrl($scope, ShareJS, availableFieldTypes, notification) {
  $scope.availableTypes = availableFieldTypes;

  $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

  $scope.$watch('entryType', function(entryType){
    if (entryType) loadPublishedEntryType();
  });

  // TODO do something similar in entry editor
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

  $scope.canPublish = function() {
    return !!$scope.otDoc;
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
        notification.error('Could not delete content type');
        console.log('Error deleting entryType', $scope.entryType);
      }
    });
  };

  $scope.publish = function() {
    $scope.entryType.publish($scope.otDoc.version, function (err, publishedEntryType) {
      $scope.$apply(function(scope){
        if (err) {
          window.alert('could not publish');
        } else {
          scope.publishedEntryType = publishedEntryType;
          $scope.$broadcast('published');
          $scope.bucketContext.refreshEntryTypes($scope);
        }
      });
    });
  };

  $scope.headline = function() {
    return this.entryType.data.name || 'Untitled';
  };

  $scope.$watch('headline()', function(title) {
    $scope.tab.title = title;
  });

});
