'use strict';

angular.module('contentful').controller('ContentTypeEditorCtrl', function ContentTypeEditorCtrl($scope, validation, can, notification, analytics, addCanMethods) {
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

  $scope.$watch(function contentTypeModifiedWatcher(scope) {
    if (scope.otDoc && scope.contentType) {
      return scope.otDoc.version > scope.contentType.getPublishedVersion() + 1;
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  addCanMethods($scope, 'contentType', {
    canPublish: function() {
      if (!$scope.otDoc) return false;
      var version = $scope.otDoc.version;
      var publishedVersion = $scope.otDoc.getAt(['sys', 'publishedVersion']);
      var notPublishedYet = !publishedVersion;
      var updatedSincePublishing = version !== publishedVersion + 1;
      var hasFields = $scope.otDoc.getAt(['fields']).length > 0;
      return $scope.contentType.canPublish() &&
        (notPublishedYet || updatedSincePublishing) &&
        hasFields &&
        can('publish', $scope.contentType.data) &&
        $scope.validationResult.valid;
    }
  });


  function loadPublishedContentType() {
    // TODO replace with lookup in registry inside spaceContext
    $scope.contentType.getPublishedStatus(function(err, publishedContentType) {
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
          notification.serverError('Could not add field', err);
        } else {
            scope.otUpdateEntity();
            scope.$broadcast('fieldAdded', ops[0].p[1]);
            analytics.modifiedContentType('Modified ContentType', scope.contentType, newField, 'add');
        }
      });
    });
  };

});
