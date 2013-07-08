'use strict';

angular.module('contentful').
  controller('ContentTypeActionsCtrl', function ContentTypeActionsCtrl($scope, notification, analytics, can) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.contentType.getName()+ '"';
  }

  $scope.delete = function () {
    $scope.contentType.delete(function (err, contentType) {
      $scope.$apply(function (scope) {
        if (err) return notification.error('Error deleting content type');
        notification.info('Content type deleted successfully');
        scope.broadcastFromSpace('entityDeleted', contentType);
        // TODO this should happen automatically
        scope.spaceContext.removeContentType($scope.contentType);
      });
    });
  };

  $scope.canDelete = function() {
    return $scope.contentType.canDelete() && can('delete', $scope.contentType.data);
  };

  $scope.canPublish = function() {
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
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    var verb = $scope.contentType.isPublished() ? 'updated' : 'activated';
    $scope.contentType.publish(version, function (err, publishedContentType) {
      $scope.$apply(function(scope){
        if (err) {
          var errorId = err.body.sys.id;
          var reason = errorId;
          if (errorId === 'validationFailed')
            reason = 'Validation failed';
          if (errorId === 'versionMismatch')
            reason = 'Can only publish most recent version';
          return notification.error('Error publishing ' + title() + ': ' + reason);
        }

        notification.info(title() + ' ' + verb + ' successfully');
        analytics.track('Published ContentType', {
          contentTypeId: $scope.contentType.getId(),
          contentTypeName: $scope.contentType.getName(),
          version: version
        });

        //console.log('editor has published %o as %o', scope.contentType, publishedContentType);
        scope.updatePublishedContentType(publishedContentType);
        scope.spaceContext.registerPublishedContentType(publishedContentType);
        scope.spaceContext.refreshContentTypes();
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.contentType.data.sys.publishedAt;
    } catch (e) { }

    if (publishedAt) {
      return 'Update';
    } else {
      return 'Activate';
    }
  };

});

