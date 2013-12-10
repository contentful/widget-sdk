'use strict';

angular.module('contentful').controller('ContentTypeEditorCtrl', function ContentTypeEditorCtrl($scope, validation, notification, analytics, addCanMethods, random) {
  $scope.fieldSchema = validation(validation.schemas.ContentType.at(['fields']).items);

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');

  $scope.$watch(function contentTypeEditorEnabledWatcher(scope) {
    return scope.contentType && scope.can('update', scope.contentType.data);
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
        $scope.can('publish', $scope.contentType.data);
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

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.contentType.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });

  $scope.updatePublishedContentType = function (publishedContentType) {
    $scope.publishedContentType = publishedContentType;
  };

  $scope.$watch('contentType.data.fields.length', function(length) {
    $scope.hasFields = length > 0;
  });

  $scope.$watch('publishedContentType.data.fields', function (fields, old, scope) {
    scope.publishedIds = _.pluck(fields, 'id');
    scope.publishedUIIDs = _.pluck(fields, 'uiid');
  });

  $scope.$watch('contentType.getName()', function(title) {
    $scope.tab.title = title;
  });

  $scope.addField = function(typeFieldTemplate) {
    var fieldDoc = $scope.otDoc.at(['fields']);

    var newField = _.extend({
      name: '',
      id: '',
      type: 'String',
      uiid: random.id()
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
