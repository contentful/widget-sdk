'use strict';

/**
 * @ngdoc type
 * @name ContentTypeActionsController
 *
 * @scope.requires {client.ContentType} contentType
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
  var notify       = $injector.get('contentType/notifications');
  var $q           = $injector.get('$q');
  var modalDialog  = $injector.get('modalDialog');
  var Command      = $injector.get('command');
  var $timeout     = $injector.get('$timeout');
  var spaceContext = $injector.get('spaceContext');

  var availableActions = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'contentType'
  });


  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  controller.delete = Command.create(startDeleteFlow, {
    available: canDelete
  });

  function canDelete () {
    return !$scope.context.isNew && (
      availableActions.canUnpublish() ||
      !$scope.contentType.isPublished()
    );
  }

  function startDeleteFlow () {
    populateDefaultName($scope.contentType);
    var isPublished = $scope.contentType.isPublished();
    return checkRemovable().then(function (isRemovable) {
      if (isRemovable) {
        return confirmRemoval(isPublished);
      }
    });
  }

  function checkRemovable () {
    var isPublished = $scope.contentType.isPublished();
    if (isPublished) {
      return $scope.ctEditorController.countEntries().then(function(count) {
        if (count > 0) {
          forbidRemoval(count);
          return false;
        } else {
          return true;
        }
      });
    } else {
      return $q.when(true);
    }
  }

  function remove (isPublished) {
    var unpub = isPublished ? unpublish() : $q.when();
    return unpub.then(sendDeleteRequest);
  }

  function forbidRemoval(count) {
    return modalDialog.openConfirmDialog({
      template: 'content_type_removal_forbidden_dialog',
      scopeData: {
        count: count,
        contentTypeName: $scope.contentType.data.name
      }
    });
  }

  function confirmRemoval(isPublished) {
    return modalDialog.openConfirmDialog({
      template: 'content_type_removal_confirm_dialog',
      scope: prepareRemovalDialogScope(isPublished),
      noNewScope: true
    });
  }

  function prepareRemovalDialogScope(isPublished) {
    var scope = $rootScope.$new();
    return _.extend(scope, {
      input: {},
      contentTypeName: $scope.contentType.data.name,
      delete: Command.create(function () {
        return remove(isPublished)
        .finally(function() {
          scope.dialog.confirm();
        });
      }, {
        disabled: function () {
          return scope.input.contentTypeName !== scope.contentTypeName;
        }
      })
    });
  }

  function unpublish() {
    return $scope.contentType.unpublish()
      .then(unpublishSuccessHandler, unpublishErrorHandler);
  }

  function unpublishSuccessHandler(publishedContentType){
    $scope.updatePublishedContentType(null);
    spaceContext.unregisterPublishedContentType(publishedContentType);
    spaceContext.refreshContentTypes();
    trackUnpublishedContentType($scope.contentType);
    return publishedContentType;
  }

  function unpublishErrorHandler(err){
    logger.logServerWarn('Error deactivating Content Type', err);
    return $q.reject(err);
  }

  function sendDeleteRequest () {
    return $scope.contentType.delete()
    .then(function () {
      notify.deleteSuccess();
      $rootScope.$broadcast('entityDeleted', $scope.contentType);
    }, notify.deleteFail);
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

  controller.runSave = save;

  function save () {
    populateDefaultName($scope.contentType);

    trackSavedContentType($scope.contentType);

    $scope.regulateDisplayField();
    if (!$scope.validate()) {
      notify.invalid();
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

      // TODO this methods seem to do the same thing
      $scope.updatePublishedContentType(published);
      spaceContext.registerPublishedContentType(published);

      // If the content type was created for the first time the API
      // will not include it immediately. In effect, not showing in the
      // new content type in the content type list.
      $timeout(function () {
        spaceContext.refreshContentTypes();
      }, 2000);

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
    if ($scope.contentTypeForm) {
      $scope.contentTypeForm.$setPristine();
    }
    return redirectWhenNew().then(notify.saveSuccess);
  }

  /**
    * Lets the digest cycle have time to properly set the pristine state
    * before trying to redirect the user, otherwise they'll be prompted
    * to save changes
  */
  function redirectWhenNew() {
    if($scope.context.isNew){
      return $q((function (res, reject) {
        defer(function () {
          $scope.$state.go('spaces.detail.content_types.detail', {
            contentTypeId: $scope.contentType.getId()
          }).then(res, reject);
        });
      }));
    } else {
      return $q.when();
    }
  }

  function triggerApiErrorNotification(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notify.invalid();
    } else if (errorId === 'VersionMismatch') {
      notify.saveOutdated();
    } else {
      notify.saveApiError(err);
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

}])

.factory('contentType/notifications', ['$injector', function ($injector) {
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  var saveError = 'Unable to save Content Type: ';
  var messages = {
    save: {
      success: 'Content Type saved successfully',
      invalid: saveError + 'Data is invalid',
      outdated:  saveError + 'Your version is outdated. Please reload and try again'
    }
  };

  return {
    deleteSuccess: function () {
      notification.info('Content Type deleted successfully');
    },

    deleteFail: function (err) {
      notification.error('Deleting Content Type failed: ' + getServerMessage(err));
      logger.logServerWarn('Error deleting Content Type', {error: err});
    },

    invalid: function () {
      notification.error(messages.save.invalid);
    },

    saveSuccess: function () {
      notification.info(messages.save.success);
    },

    saveOutdated: function () {
      notification.error(messages.save.outdated);
    },

    saveApiError: function (err) {
      var message = saveError + getServerMessage(err);
      notification.error(message);
      logger.logServerWarn('Error activating Content Type', {error: err});
    }
  };


  function getServerMessage (err) {
    return dotty.get(err, 'body.message') ||
           dotty.get(err, 'body.sys.id') ||
           'Unknown server error';
  }

}]);
