'use strict';

angular.module('contentful').
  controller('ContentTypeActionsCtrl', function ContentTypeActionsCtrl($scope, notification, analytics) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.contentType.getName()+ '"';
  }

  $scope['delete'] = function () {
    $scope.contentType['delete'](function (err, contentType) {
      $scope.$apply(function (scope) {
        if (err) return notification.serverError('Error deleting Content Type', err);
        notification.info('Content type deleted successfully');
        scope.broadcastFromSpace('entityDeleted', contentType);
        // TODO this should happen automatically
        // setup an event listener when the spaceContext instance is created
        // on client controller or space context controller
        scope.spaceContext.removeContentType($scope.contentType);
      });
    });
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
          return notification.serverError('Error publishing ' + title() + ': ' + reason, err);
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

  $scope.unpublish = function () {
    $scope.contentType.unpublish(function (err, publishedContentType) {
      $scope.$apply(function(scope){
        if (err) {
          var reason = err.body.message;
          return notification.serverError('Error deactivating ' + title() + ': ' + reason, err);
        }

        notification.info(title() + ' deactivated successfully');
        analytics.track('Unpublished ContentType', {
          contentTypeId: $scope.contentType.getId(),
          contentTypeName: $scope.contentType.getName(),
          version: $scope.contentType.getVersion()
        });

        //console.log('editor has unpublished %o as %o', scope.contentType, publishedContentType);
        scope.updatePublishedContentType(null);
        scope.spaceContext.unregisterPublishedContentType(publishedContentType);
        scope.spaceContext.refreshContentTypes();
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.contentType.getPublishedAt();
    } catch (e) { }

    if (publishedAt) {
      return 'Update';
    } else {
      return 'Activate';
    }
  };

});

