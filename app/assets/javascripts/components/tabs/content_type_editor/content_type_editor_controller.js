'use strict';

angular.module('contentful').controller('ContentTypeEditorCtrl', function ContentTypeEditorCtrl($scope, validation, can, notification, analytics) {
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');

  $scope.$watch(function contentTypeEditorEnabledWatcher(scope) {
    return scope.contentType && can('update', scope.contentType.data);
  }, function contentTypeEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  $scope.tab.closingMessage = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';

  $scope.$watch('contentType', function(contentType){
    if (contentType) loadPublishedContentType();
  });

  $scope.$on('entityDeleted', function (event, contentType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (contentType === scope.contentType) {
        scope.tab.close();
      }
    }
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  $scope.$watch(function (scope) {
    if (scope.otDoc && scope.contentType) {
      return scope.otDoc.version > scope.contentType.data.sys.publishedVersion + 1;
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
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
  });

  $scope.canPublish = function() {
    return !!$scope.otDoc;
  };

  $scope.$watch('contentType.getName()', function(title) {
    $scope.tab.title = title;
  });

  $scope.addField = function(typeFieldTemplate) {
    var fieldDoc = $scope.otDoc.at(['fields']);

    var newField = _.extend({
      name: '',
      id: '',
      type: 'String'
    }, typeFieldTemplate);

    fieldDoc.push(newField, function(err, ops) {
      $scope.$apply(function(scope) {
        if (err) {
          notification.error('Could not add field');
        } else {
            scope.otUpdateEntity();
            scope.$broadcast('fieldAdded', ops[0].p[1]);
            analytics.modifiedContentType('Modified ContentType', scope.contentType, newField, 'add');
        }
      });
    });
  };

});
