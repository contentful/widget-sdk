'use strict';

/**
 * @ngdoc type
 * @name ContentTypeActionsController
 *
 * @scope.requires {client.ContentType} contentType
 * @scope.requires                      spaceContext
 */
angular.module('contentful').
  controller('ContentTypeActionsController', ['$scope', '$injector', function ContentTypeActionsController($scope, $injector) {
  var $rootScope   = $injector.get('$rootScope');
  var analytics    = $injector.get('analytics');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');
  var $q = $injector.get('$q');

  var saveError = 'Unable to save Content Type: ';
  var messages = {
    save: {
      success: 'Content Type saved successfully',
      invalid: saveError + 'Data is invalid',
      outdated:  saveError + 'Your version is outdated. Please reload and try again'
    }
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#delete
   */
  $scope.delete = function () {
    $scope.contentType.delete()
    .then(function(contentType){
      notification.info('Content type deleted successfully');
      $rootScope.$broadcast('entityDeleted', contentType);
    })
    .catch(function(err){
      logger.logServerWarn('Error deleting Content Type', {error: err });
      notification.error('Error deleting Content Type');
    });
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#save
   * @description
   * Saves the content type and editing interface to the server.
   */
  $scope.save = function () {
    $scope.regulateDisplayField();
    if (!$scope.validate()) {
      notification.error(messages.save.invalid);
      return $q.reject();
    }
    var contentTypeSave = $scope.contentType.save()
    .then(publishContentType)
    .catch(saveErrorHandler);

    var editingInterfaceSave = $scope.editingInterface.save()
    .catch(saveErrorHandler);

    return $q.all([contentTypeSave, editingInterfaceSave])
    .then(function () {
      notification.info(messages.save.success);
      $scope.contentTypeForm.$setPristine();
    });
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#canSave
   */
  $scope.canSave = function () {
    return $scope.contentTypeForm.$dirty;
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#scope#unpublish
   */
  $scope.unpublish = function () {
    $scope.contentType.unpublish()
    .then(unpublishSuccessHandler)
    .catch(unpublishErrorHandler);
  };

  function publishContentType(contentType) {
    var version = contentType.getVersion();
    return contentType.publish(version)
    .then(function (published) {
      contentType.setPublishedVersion(version);
      $scope.updatePublishedContentType(published);
      $scope.spaceContext.registerPublishedContentType(published);
      $scope.spaceContext.refreshContentTypes();

      trackContentTypeAction('Published', $scope.contentType);
    });
  }

  function trackContentTypeAction(action, contentType) {
    analytics.track(action + ' ContentType', {
      contentTypeId: contentType.getId(),
      contentTypeName: contentType.getName(),
      version: contentType.getVersion()
    });
  }

  function saveErrorHandler(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notification.error(message.save.invalid);
    } else if (errorId === 'VersionMismatch') {
      notification.warn(messages.save.outdated);
    } else {
      var message = 'Unable to save Content Type: ';
      message += dotty.get(err, 'body.message');
      notification.error(message);
      logger.logServerWarn('Error activating Content Type', err);
    }
  }


  function unpublishSuccessHandler(publishedContentType){
    $scope.updatePublishedContentType(null);
    $scope.spaceContext.unregisterPublishedContentType(publishedContentType);
    $scope.spaceContext.refreshContentTypes();

    notification.info('Content Type deactivated successfully');
    trackContentTypeAction('Unpublished', $scope.contentType);
  }

  function unpublishErrorHandler(err){
    var reason = dotty.get(err, 'body.message');
    if(!reason) logger.logServerWarn('Error deactivating Content Type', err);
    notification.error('Unable to deactivate Content Type: ' + reason, err);
  }
}]);

