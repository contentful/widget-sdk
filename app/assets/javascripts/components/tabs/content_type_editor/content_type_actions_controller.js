'use strict';

angular.module('contentful').
  controller('ContentTypeActionsController', ['$scope', '$injector', function ContentTypeActionsController($scope, $injector) {
  var analytics    = $injector.get('analytics');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.contentType.getName()+ '"';
  }

  $scope.delete = function () {
    $scope.contentType.delete()
    .then(function(contentType){
      notification.info('Content type deleted successfully');
      $scope.broadcastFromSpace('entityDeleted', contentType);
      // TODO this should happen automatically
      // setup an event listener when the spaceContext instance is created
      // on client controller or space context controller
      $scope.spaceContext.removeContentType($scope.contentType);
    })
    .catch(function(err){
      notification.serverError('Error deleting Content Type', err);
    });
  };

  $scope.publish = function () {
    $scope.sanitizeDisplayField()
    .then(function(){
      if (!$scope.validate()) {
        notification.warn('Error activating ' + title() + ': ' + 'Validation failed');
        return;
      }
      var verb = $scope.contentType.isPublished() ? 'updated' : 'activated';
      var version = $scope.contentType.getVersion();
      $scope.contentType.publish(version)
      .then(function(publishedContentType){
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
      })
      .catch(function(err){
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
        notification[method]('Error activating ' + title() + ': ' + reason, err);
      });
    });
  };

  $scope.unpublish = function () {
    $scope.contentType.unpublish()
    .then(function(publishedContentType){
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
    })
    .catch(function(err){
      var reason = dotty.get(err, 'body.message');
      if(!reason) logger.logServerError('Error deactivating Content Type', err);
      notification.warn('Error deactivating ' + title() + ': ' + reason, err);
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

