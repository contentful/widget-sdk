'use strict';

angular.module('contentful').
  controller('ContentTypeActionsCtrl', ['$scope', 'notification', 'analytics', 'logger', function ContentTypeActionsCtrl($scope, notification, analytics, logger) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.contentType.getName()+ '"';
  }

  $scope['delete'] = function () {
    $scope.contentType['delete'](function (err, contentType) {
      if (err) return notification.serverError('Error deleting Content Type', err);
      notification.info('Content type deleted successfully');
      $scope.broadcastFromSpace('entityDeleted', contentType);
      // TODO this should happen automatically
      // setup an event listener when the spaceContext instance is created
      // on client controller or space context controller
      $scope.spaceContext.removeContentType($scope.contentType);
    });
  };

  $scope.publish = function () {
    var version = $scope.contentType.getVersion();
    var verb = $scope.contentType.isPublished() ? 'updated' : 'activated';
    if (!$scope.validate()) {
      notification.warn('Error activating ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.contentType.publish(version, function (err, publishedContentType) {
      if (err) {
        var errorId = dotty.get(err, 'body.sys.id');
        var method = 'serverError';
        var reason = errorId;
        if (errorId === 'ValidationFailed') {
          reason = 'Validation failed';
          $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
          method = 'warn';
        } else if (errorId === 'VersionMismatch') {
          reason = 'Can only activate most recent version';
          method = 'warn';
        } else {
          reason = dotty.get(err, 'body.message');
        }
        return notification[method]('Error activating ' + title() + ': ' + reason, err);
      }

      notification.info(title() + ' ' + verb + ' successfully');
      analytics.track('Published ContentType', {
        contentTypeId: $scope.contentType.getId(),
        contentTypeName: $scope.contentType.getName(),
        version: version
      });
      $scope.contentType.setPublishedVersion(version);

      //console.log('editor has published %o as %o', scope.contentType, publishedContentType);
      $scope.updatePublishedContentType(publishedContentType);
      $scope.spaceContext.registerPublishedContentType(publishedContentType);
      $scope.spaceContext.refreshContentTypes();
    });
  };

  $scope.unpublish = function () {
    $scope.contentType.unpublish(function (err, publishedContentType) {
      if (err) {
        var reason = dotty.get(err, 'body.message');
        if(!reason) logger.logServerError('Error deactivating Content Type', err);
        return notification.warn('Error deactivating ' + title() + ': ' + reason, err);
      }

      notification.info(title() + ' deactivated successfully');
      analytics.track('Unpublished ContentType', {
        contentTypeId: $scope.contentType.getId(),
        contentTypeName: $scope.contentType.getName(),
        version: $scope.contentType.getVersion()
      });

      //console.log('editor has unpublished %o as %o', scope.contentType, publishedContentType);
      $scope.updatePublishedContentType(null);
      $scope.spaceContext.unregisterPublishedContentType(publishedContentType);
      $scope.spaceContext.refreshContentTypes();
    });
  };

  $scope.publishButtonLabel = function () {
    if ($scope.contentType && $scope.contentType.isPublished()) {
      return 'Update';
    } else {
      return 'Activate';
    }
  };

}]);

