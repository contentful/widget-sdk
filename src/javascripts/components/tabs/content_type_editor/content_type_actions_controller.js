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
  var controller         = this;
  var $rootScope         = $injector.get('$rootScope');
  var analytics          = $injector.get('analytics');
  var logger             = $injector.get('logger');
  var notify             = $injector.get('contentType/notifications');
  var $q                 = $injector.get('$q');
  var modalDialog        = $injector.get('modalDialog');
  var Command            = $injector.get('command');
  var spaceContext       = $injector.get('spaceContext');
  var $state             = $injector.get('$state');
  var accessChecker      = $injector.get('accessChecker');
  var ReloadNotification = $injector.get('ReloadNotification');
  var ctHelpers          = $injector.get('data/ContentTypes');
  var closeState         = $injector.get('navigation/closeState');

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  controller.delete = Command.create(startDeleteFlow, {
    available: function () {
      var deletableState = !$scope.context.isNew && (
        $scope.contentType.canUnpublish() ||
        !$scope.contentType.isPublished()
      );
      var denied = accessChecker.shouldHide('deleteContentType') ||
                   accessChecker.shouldHide('unpublishContentType');
      return deletableState && !denied;
    },
    disabled: function () {
      return accessChecker.shouldDisable('deleteContentType') ||
             accessChecker.shouldDisable('unpublishContentType');
    }
  });

  function startDeleteFlow () {
    return checkRemovable().then(function (status) {
      if (status.isRemovable) {
        return confirmRemoval(status.isPublished);
      } else {
        forbidRemoval(status.entryCount);
      }
    }, ReloadNotification.basicErrorHandler);
  }

  function checkRemovable () {
    var isPublished = $scope.contentType.isPublished();
    var canRead = accessChecker.canPerformActionOnEntryOfType('read', $scope.contentType.getId());

    if (!isPublished) {
      return $q.resolve(createStatusObject(true));
    }

    return $scope.ctEditorController.countEntries().then(function(count) {
      return createStatusObject(canRead && count < 1, count);
    }, function (response) {
      if (parseInt(response.statusCode, 10) === 404 && !canRead) {
        return createStatusObject(false);
      } else {
        return $q.reject(response);
      }
    });

    function createStatusObject(isRemovable, entryCount) {
      return {
        isPublished: isPublished,
        isRemovable: isRemovable,
        entryCount: entryCount
      };
    }
  }

  function remove (isPublished) {
    var unpub = isPublished ? unpublish() : $q.resolve();
    return unpub.then(sendDeleteRequest);
  }

  function forbidRemoval(count) {
    return modalDialog.open({
      template: 'content_type_removal_forbidden_dialog',
      scopeData: {
        count: count > 0 ? count : '',
        contentTypeName: $scope.contentType.data.name
      }
    });
  }

  function confirmRemoval(isPublished) {
    return modalDialog.open({
      template: 'content_type_removal_confirm_dialog',
      scope: prepareRemovalDialogScope(isPublished),
      noNewScope: true,
      persistOnNavigation: true
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
    $scope.publishedContentType = null;
    spaceContext.unregisterPublishedContentType(publishedContentType);
    spaceContext.refreshContentTypes();
    trackUnpublishedContentType($scope.contentType);
    return publishedContentType;
  }

  function unpublishErrorHandler(err){
    logger.logServerWarn('Error deactivating Content Type', {error: err});
    return $q.reject(err);
  }

  function sendDeleteRequest () {
    return $scope.contentType.delete()
    .then(function () {
      notify.deleteSuccess();
      spaceContext.removeContentType($scope.contentType);
      return closeState();
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
    return $state.go('^.list');
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
  controller.save = Command.create(function () {
    return save(true);
  }, {
    disabled: function () {
      var dirty = $scope.contentTypeForm.$dirty ||
                  !$scope.contentType.getPublishedVersion();
      var valid = !allFieldsDisabled($scope.contentType);
      var denied = accessChecker.shouldDisable('updateContentType') ||
                   accessChecker.shouldDisable('publishContentType');

      return !dirty || !valid || denied;
    }
  });

  // This is called by the state manager in case the user leaves the
  // Content Type editor without saving. We do not redirect in that
  // case.
  controller.saveAndClose = function () {
    return save(false);
  };

  function save (redirect) {
    trackSavedContentType($scope.contentType);
    ctHelpers.assureDisplayField($scope.contentType.data);

    if (!$scope.validate()) {
      var fieldNames = _.pluck($scope.contentType.data.fields, 'name');
      notify.invalid($scope.validationResult.errors, fieldNames);
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
      unpublish = $q.resolve();
    }

    return unpublish
    .then(function () {
      return $scope.contentType.save();
    })
    .then(publishContentType)
    .then(saveEditingInterface)
    .catch(triggerApiErrorNotification)
    .then(setPristine)
    .then(function () {
      if (redirect && $scope.context.isNew) {
        return goToDetails();
      }
    }).then(notify.saveSuccess);
  }

  function publishContentType(contentType) {
    var version = contentType.getVersion();
    return contentType.publish(version)
    .then(function (published) {
      contentType.setPublishedVersion(version);
      $scope.publishedContentType = published;
      spaceContext.registerPublishedContentType(published);

      if (version === 1) {
        spaceContext.refreshContentTypesUntilChanged();
      } else {
        spaceContext.refreshContentTypes();
      }

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

  function saveEditingInterface (contentType) {
    return spaceContext.editingInterfaces.save(contentType.data, $scope.editingInterface)
    .then(function (editingInterface) {
      $scope.editingInterface = editingInterface;
    });
  }

  function setPristine () {
    // Since this is called by asynchronously the scope data may have
    // already been removed.
    if ($scope.contentTypeForm) {
      $scope.contentTypeForm.$setPristine();
    }
    if ($scope.context) {
      $scope.context.dirty = false;
    }
  }

  function goToDetails () {
    return $state.go('spaces.detail.content_types.detail', {
      contentTypeId: $scope.contentType.getId()
    });
  }

  function triggerApiErrorNotification(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notify.invalid();
    } else if (errorId === 'VersionMismatch') {
      if ($scope.contentType.getVersion()) {
        logger.logServerWarn('Error activating outdated Content Type', {
          error: err,
          contentType: $scope.contentType
        });
        notify.saveOutdated();
      } else {
        notify.saveIdExists();
      }
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
  var truncate     = $injector.get('stringUtils').truncate;

  var saveError = 'Unable to save Content Type: ';
  var messages = {
    save: {
      success: 'Content Type saved successfully',
      invalid: saveError + 'Data is invalid',
      outdated:  saveError + 'Your version is outdated. Please reload and try again'
    },
    create: {
      exists: 'A Content Type with this ID already exists'
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

    invalid: function (errors, fieldNames) {
      var fieldErrors = _.filter(errors, function (error) {
        return error.path && error.path[0] === 'fields';
      });

      var errorFieldName = _.first(_.map(fieldErrors, function (error) {
        return fieldNames[error.path[1]];
      }));

      if (errorFieldName) {
        notification.error(saveError + 'Invalid field “' + truncate(errorFieldName, 12) + '”');
      } else {
        notification.error(messages.save.invalid);
      }
    },

    saveSuccess: function () {
      notification.info(messages.save.success);
    },

    saveOutdated: function () {
      notification.error(messages.save.outdated);
    },

    saveIdExists: function () {
      notification.warn(messages.create.exists);
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
