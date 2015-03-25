'use strict';

angular.module('contentful').
  controller('ContentTypeActionsController', ['$scope', '$injector', function ContentTypeActionsController($scope, $injector) {
  var analytics    = $injector.get('analytics');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere
  //
  // TODO Most of this stuff (the actual actions, not the notifications and all the logistics around it)
  // should be in the SpaceContext (later to become ContentTypesController)

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
      logger.logServerWarn('Error deleting Content Type', {error: err });
      notification.error('Error deleting Content Type');
    });
  };

  $scope.publish = function () {
    $scope.regulateDisplayField();
    if (!$scope.validate()) {
      notification.warn('Error activating ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.contentType.save()
    .then(saveSuccessHandler)
    .catch(saveErrorHandler);
  };

  function saveSuccessHandler(contentType) {
    var version = contentType.getVersion();
    var verb = $scope.contentType.isPublished() ? 'updated' : 'activated';
    contentType.publish(version)
    .then(makePublishSuccessHandler(contentType, version, verb))
    .catch(publishErrorHandler);
  }

  function saveErrorHandler(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    var messagePrefix = 'Error saving ' + title() + ': ';
    if (errorId === 'VersionMismatch') {
      notification.warn(messagePrefix + 'Can only save most recent version');
    } else {
      var reason = dotty.get(err, 'body.message');
      notification.error(messagePrefix + reason);
      logger.logServerWarn('Error saving Content Type', {error: err});
    }

  }

  function makePublishSuccessHandler(contentType, version, verb) {
    return function (publishedContentType){
      contentType.setPublishedVersion(version);
      $scope.updatePublishedContentType(publishedContentType);
      $scope.spaceContext.registerPublishedContentType(publishedContentType);
      $scope.spaceContext.refreshContentTypes();
      $scope.contentTypeForm.$setPristine();

      notification.info(title() + ' ' + verb + ' successfully');
      analytics.track('Published ContentType', {
        contentTypeId: $scope.contentType.getId(),
        contentTypeName: $scope.contentType.getName(),
        version: version
      });
    };
  }

  function publishErrorHandler(err){
    var errorId = dotty.get(err, 'body.sys.id');
    var messagePrefix = 'Error activating ' + title() + ': ';
    if (errorId === 'ValidationFailed') {
      $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
      notification.warn(messagePrefix + 'Validation failed');
    } else if (errorId === 'VersionMismatch') {
      notification.warn(messagePrefix + 'Can only activate most recent version');
    } else {
      var reason = dotty.get(err, 'body.message');
      notification.error(messagePrefix + reason);
      logger.logServerWarn('Error activating Content Type', {error: err});
    }
  }

  $scope.unpublish = function () {
    $scope.contentType.unpublish()
    .then(unpublishSuccessHandler)
    .catch(unpublishErrorHandler);
  };

  function unpublishSuccessHandler(publishedContentType){
    $scope.updatePublishedContentType(null);
    $scope.spaceContext.unregisterPublishedContentType(publishedContentType);
    $scope.spaceContext.refreshContentTypes();

    notification.info(title() + ' deactivated successfully');
    analytics.track('Unpublished ContentType', {
      contentTypeId: $scope.contentType.getId(),
      contentTypeName: $scope.contentType.getName(),
      version: $scope.contentType.getVersion()
    });
  }

  function unpublishErrorHandler(err){
    var reason = dotty.get(err, 'body.message');
    if(!reason) logger.logServerWarn('Error deactivating Content Type', {error: err });
    notification.warn('Error deactivating ' + title() + ': ' + reason, err);
  }

  $scope.publishButtonLabel = function () {
    if ($scope.contentType && $scope.contentType.isPublished()) {
      return 'Update';
    } else {
      return 'Activate';
    }
  };

}]);

