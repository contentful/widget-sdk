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
          $scope.$broadcast('published');
          $scope.bucketContext.refreshEntryTypes($scope);
        }
      });
    });
  };

  $scope.headline = function(){
    var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
    return verb + ' Content Type';
  };

});
