'use strict';

angular.module('contentful').controller('ContentTypeEditorCtrl', function ContentTypeEditorCtrl($scope, ShareJS, availableFieldTypes, validation, can) {
  $scope.availableTypes = availableFieldTypes;
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');

  $scope.$watch(function contentTypeEditorEnabledWatcher(scope) {
    return can('update', scope.contentType);
  }, function contentTypeEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  $scope.$watch('contentType', function(contentType){
    if (contentType) loadPublishedContentType();
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.$on('otTextIdle', function (event, path, value) {
    if (path[0] == 'fields' && path[2] == 'name') {
      event.currentScope.contentType.data.fields[path[1]].name = value;
    }
  });

  function loadPublishedContentType() {
    // TODO replace with lookup in registry inside spaceContext
    $scope.contentType.getPublishedVersion(function(err, publishedContentType) {
      $scope.$apply(function(scope) {
        scope.publishedContentType = publishedContentType;
      });
    });
  }

  $scope.updatePublishedContentType = function (publishedContentType) {
    $scope.publishedContentType = publishedContentType;
  };

  $scope.$watch('contentType.data.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    //console.log('refreshing publishedIds', scope.publishedIds);
  });

  $scope.canPublish = function() {
    return !!$scope.otDoc;
  };

  $scope.$watch('contentType.getName()', function(title) {
    $scope.tab.title = title;
  });

});
