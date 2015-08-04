'use strict';

/**
 * @ngdoc type
 * @name ContentTypeActionsController
 *
 * @scope.requires {client.ContentType} contentType
 * @scope.requires                      spaceContext
 */
angular.module('contentful')
.controller('ContentTypeActionsController', ['$scope', '$injector',
function ContentTypeActionsController($scope, $injector) {
  var controller   = this;
  var $controller  = $injector.get('$controller');
  var $rootScope   = $injector.get('$rootScope');
  var analytics    = $injector.get('analytics');
  var logger       = $injector.get('logger');
  var defer        = $injector.get('defer');
  var notification = $injector.get('notification');
  var $q           = $injector.get('$q');
  var modalDialog  = $injector.get('modalDialog');
  var Command      = $injector.get('command');

  var availableActions = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'contentType'
  });

  var saveError = 'Unable to save Content Type: ';
  var messages = {
    save: {
      success: 'Content Type saved successfully',
      invalid: saveError + 'Data is invalid',
      outdated:  saveError + 'Your version is outdated. Please reload and try again'
    }
  };

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  controller.delete = Command.create(remove, {
    available: canDelete
  });

  function canDelete () {
    return !$scope.context.isNew && (
      availableActions.canUnpublish() ||
      !$scope.contentType.isPublished()
    );
  }

  function remove () {
    populateDefaultName($scope.contentType);
    if ($scope.contentType.isPublished()) {
      return $scope.ctEditorController.countEntries().then(function(count) {
        if (count > 0) {
          forbidRemoval(count);
          return;
        }

        confirmRemoval().then(function(result) {
          if (result.cancelled) { return; }
          return unpublish().then(sendDeleteRequest);
        });

      }, removalErrorHandler);
    } else {
      return confirmRemoval().then(function(result) {
        if (result.cancelled) { return; }
        return sendDeleteRequest();
      });
    }
  }

  function forbidRemoval(count) {
    var dialogScope = prepareRemovalDialogScope();
    dialogScope.data.count = count;

    return modalDialog.openConfirmDialog({
      template: 'content_type_removal_forbidden_dialog',
      scope: dialogScope
    });
  }

  function confirmRemoval() {
    return modalDialog.openConfirmDialog({
      template: 'content_type_removal_confirm_dialog',
      scope: prepareRemovalDialogScope()
    });
  }

  function prepareRemovalDialogScope() {
    var dialogScope = $rootScope.$new();
    dialogScope.data = { contentTypeName: $scope.contentType.data.name };
    return dialogScope;
  }

  function unpublish() {
    return $scope.contentType.unpublish()
      .then(unpublishSuccessHandler, unpublishErrorHandler);
  }

  function unpublishSuccessHandler(publishedContentType){
    $scope.updatePublishedContentType(null);
    $scope.spaceContext.unregisterPublishedContentType(publishedContentType);
    $scope.spaceContext.refreshContentTypes();
    trackUnpublishedContentType($scope.contentType);
    return publishedContentType;
  }

  function unpublishErrorHandler(err){
    logger.logServerWarn('Error deactivating Content Type', err);
    return $q.reject(err);
  }

  function sendDeleteRequest () {
    return $scope.contentType.delete()
      .then(removalSuccessHandler, removalErrorHandler);
  }

  function removalSuccessHandler(contentType){
    notification.info('Content type deleted successfully');
    $rootScope.$broadcast('entityDeleted', contentType);
  }

  function removalErrorHandler(err) {
    logger.logServerWarn('Error deleting Content Type', err);
    notification.error('Error deleting Content Type');
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
   * @ngdoc property
   * @name ContentTypeActionsController#scope#cancel
   * @type {Command}
   */
  controller.cancel = Command.create(function () {
    return $scope.$state.go('^.list');
  }, {
    available: function () {
      return $scope.context.isNew;
    }
  });


  /**
   * @ngdoc property
   * @name ContentTypeActionsController#save
   * @type {Command}
   */
  controller.save = Command.create(save, {
    disabled: function () {
      var dirty = $scope.contentTypeForm.$dirty ||
                  !$scope.contentType.getPublishedVersion();
      var valid = !allFieldsDisabled($scope.contentType);
      return !dirty || !valid;
    }
  });

  function save () {
    populateDefaultName($scope.contentType);

    trackSavedContentType($scope.contentType);

    $scope.regulateDisplayField();
    if (!$scope.validate()) {
      notification.error(messages.save.invalid);
      return $q.reject();
    }

    var unpublish;
    if (hasFieldRemoved($scope.contentType)) {
      var oldData = $scope.contentType.data;
      unpublish = $scope.contentType.unpublish().then(function (published) {
        oldData.sys = published.data.sys;
        $scope.contentType.data = oldData;
      });
    } else {
      unpublish = $q.when();
    }

    return unpublish
    .then(function () {
      return $scope.contentType.save();
    })
    .then(publishContentType)
    .then(saveEditingInterface)
    .then(postSaveActions, triggerApiErrorNotification);
  }

  // This is handling legacy content types.
  // FIXME This is not the proper place for this function, it should be
  // handled when loading the CT. Unfortunately this is not currently
  // possible.
  function populateDefaultName (contentType) {
    if (contentType && contentType.data && !contentType.data.name) {
      contentType.data.name = 'Untitled';
    }
  }

  function publishContentType(contentType) {
    var version = contentType.getVersion();
    return contentType.publish(version)
    .then(function (published) {
      contentType.setPublishedVersion(version);
      $scope.publishedContentType = published;
      $scope.updatePublishedContentType(published);
      $scope.spaceContext.registerPublishedContentType(published);
      $scope.spaceContext.refreshContentTypes();

      return contentType;
    });
  }

  function hasFieldRemoved (contentType) {
    var newFields = _.map(contentType.data.fields, 'id');
    var publishedCT = $scope.publishedContentType;
    if (!publishedCT) {
      return false;
    }

    var publishedFields = _.map(dotty.get(publishedCT, 'data.fields'), 'id');
    var diff = _.difference(publishedFields, newFields);
    return diff.length > 0;
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
    if ($scope.contentTypeForm) {
      $scope.contentTypeForm.$setPristine();
    }
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
