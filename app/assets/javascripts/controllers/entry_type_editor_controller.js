'use strict';

angular.module('contentful').controller('EntryTypeEditorCtrl', function EntryTypeEditorCtrl($scope, ShareJS, availableFieldTypes, validation) {
  $scope.availableTypes = availableFieldTypes;
  $scope.fieldSchema = validation(validation.schemas.EntryType.at(['fields']).items);

  $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

  $scope.$watch('entryType', function(entryType){
    if (entryType) loadPublishedEntryType();
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  function loadPublishedEntryType() {
    // TODO replace with lookup in registry inside bucketContext
    $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
      $scope.$apply(function(scope) {
        scope.publishedEntryType = publishedEntryType;
      });
    });
  }

  $scope.updatePublishedEntryType = function (publishedEntryType) {
    $scope.publishedEntryType = publishedEntryType;
  };

  $scope.$watch('otDoc.snapshot.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('publishedEntryType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    //console.log('refreshing publishedIds', scope.publishedIds);
  });

  $scope.canPublish = function() {
    return !!$scope.otDoc;
  };

  $scope.headline = function() {
    return this.entryType.data.name || 'Untitled';
  };

  $scope.$watch('headline()', function(title) {
    $scope.tab.title = title;
  });

});
