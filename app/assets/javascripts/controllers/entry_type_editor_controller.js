'use strict';

angular.module('contentful/controllers').controller('EntryTypeEditorCtrl', function EntryTypeEditorCtrl($scope, ShareJS, availableFieldTypes) {
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
    $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
      $scope.$apply(function(scope) {
        scope.publishedEntryType = publishedEntryType;
      });
    });
  }

  $scope.$watch('doc.snapshot.fields.length', function(length) {
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
