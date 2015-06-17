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
  var defer        = $injector.get('defer');
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
   * @name ContentTypeActionsController#scope#cancel
   */
  $scope.cancel = function () {
    $scope.$state.go('^.list');
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#scope#save
   */
  $scope.save = function () {
    trackSavedContentType($scope.contentType);

    $scope.regulateDisplayField();
    if (!$scope.validate()) {
      notification.error(messages.save.invalid);
      return $q.reject();
    }

    return $scope.contentType.save()
    .then(publishContentType)
    .then(saveEditingInterface)
    .then(postSaveActions, triggerApiErrorNotification);
  };

  /**
   * @ngdoc method
   * @name ContentTypeActionsController#canSave
   */
  $scope.canSave = function () {
    return $scope.contentTypeForm.$dirty &&
           !allFieldsDisabled($scope.contentType);
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

      return contentType;
    });
  }

  function saveEditingInterface(contentType) {
    if(!$scope.editingInterface.getVersion()){
      var data = _.clone($scope.editingInterface.data);
      data.contentTypeId = contentType.getId();
      $scope.editingInterface = contentType.newEditingInterface(data);
    }
    return $scope.editingInterface.save();
  }

  function postSaveActions() {
    notification.info(messages.save.success);
    $scope.contentTypeForm.$setPristine();
    redirectWhenNew();
    return $scope.contentType;
  }

  /**
    * Lets the digest cycle have time to properly set the pristine state
    * before trying to redirect the user, otherwise they'll be prompted
    * to save changes
  */
  function redirectWhenNew() {
    if($scope.context.isNew){
      defer(function () {
        $scope.$state.go('spaces.detail.content_types.detail', {
          contentTypeId: $scope.contentType.getId()
        });
      });
    }
  }

  function triggerApiErrorNotification(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notification.error(messages.save.invalid);
    } else if (errorId === 'VersionMismatch') {
      notification.warn(messages.save.outdated);
    } else {
      var message = saveError + (dotty.get(err, 'body.message') || err);
      notification.error(message);
      logger.logServerWarn('Error activating Content Type', err);
    }
    return $q.reject(err);
  }

  function unpublishSuccessHandler(publishedContentType){
    $scope.updatePublishedContentType(null);
    $scope.spaceContext.unregisterPublishedContentType(publishedContentType);
    $scope.spaceContext.refreshContentTypes();

    notification.info('Content Type deactivated successfully');
    trackUnpublishedContentType($scope.contentType);
  }

  function unpublishErrorHandler(err){
    var reason = dotty.get(err, 'body.message');
    if(!reason) logger.logServerWarn('Error deactivating Content Type', err);
    notification.error('Unable to deactivate Content Type: ' + reason, err);
  }


  /**
   * @ngdoc analytics-event
   * @name Unpublished Content Type
   */
  function trackUnpublishedContentType(contentType) {
    analytics.track('Unpublished ContentType', {
      contentTypeId: contentType.getId(),
      contentTypeName: contentType.getName(),
      version: contentType.getVersion()
    });
  }

  /**
   * @ngdoc analytics-event
   * @name Clicked Save Content Type Button
   * @param initialSave
   */
  function trackSavedContentType (contentType) {
    var isNew = !_.isNumber(contentType.getId());
    analytics.track('Clicked Save Content Type Button', {
      initialSave: isNew
    });
  }

  function allFieldsDisabled (contentType) {
    return _.all(contentType.data.fields, 'disabled');
  }

}]);

