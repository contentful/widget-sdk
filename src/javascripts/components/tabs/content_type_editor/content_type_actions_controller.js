'use strict';

/**
 * @ngdoc type
 * @name ContentTypeActionsController
 *
 * @scope.requires {client.ContentType} contentType
 */
angular.module('contentful')
.controller('ContentTypeActionsController', ['$scope', '$injector',
function ContentTypeActionsController ($scope, $injector) {
  var controller = this;
  var $rootScope = $injector.get('$rootScope');
  var analytics = $injector.get('analytics');
  var logger = $injector.get('logger');
  var notify = $injector.get('contentType/notifications');
  var $q = $injector.get('$q');
  var modalDialog = $injector.get('modalDialog');
  var Command = $injector.get('command');
  var spaceContext = $injector.get('spaceContext');
  var $state = $injector.get('$state');
  var accessChecker = $injector.get('accessChecker');
  var ReloadNotification = $injector.get('ReloadNotification');
  var ctHelpers = $injector.get('data/ContentTypes');
  var closeState = $injector.get('navigation/closeState');
  var metadataDialog = $injector.get('contentTypeEditor/metadataDialog');
  var uiConfig = $injector.get('uiConfig');
  var previewEnvironmentsCache = $injector.get('data/previewEnvironmentsCache');

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

    return spaceContext.space.getEntries({
      content_type: $scope.contentType.getId()
    }).then(function (res) {
      var count = res.length;
      return createStatusObject(canRead && count < 1, count);
    }, function (res) {
      if (res.statusCode === 404 && !canRead) {
        return createStatusObject(false);
      } else {
        return $q.reject(res);
      }
    });

    function createStatusObject (isRemovable, entryCount) {
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

  function forbidRemoval (count) {
    return modalDialog.open({
      template: 'content_type_removal_forbidden_dialog',
      scopeData: {
        count: count > 0 ? count : '',
        contentTypeName: $scope.contentType.data.name
      }
    });
  }

  function confirmRemoval (isPublished) {
    return modalDialog.open({
      template: 'content_type_removal_confirm_dialog',
      scope: prepareRemovalDialogScope(isPublished),
      noNewScope: true,
      persistOnNavigation: true
    });
  }

  function prepareRemovalDialogScope (isPublished) {
    var scope = $rootScope.$new();
    return _.extend(scope, {
      input: {},
      contentTypeName: $scope.contentType.data.name,
      delete: Command.create(function () {
        return remove(isPublished)
        .finally(function () {
          scope.dialog.confirm();
        });
      }, {
        disabled: function () {
          return scope.input.contentTypeName !== scope.contentTypeName;
        }
      })
    });
  }

  function unpublish () {
    return $scope.contentType.unpublish()
      .then(unpublishSuccessHandler, unpublishErrorHandler);
  }

  function unpublishSuccessHandler (publishedContentType) {
    $scope.publishedContentType = null;
    $scope.ctEditorController.registerPublishedFields(null);
    spaceContext.unregisterPublishedContentType(publishedContentType);
    spaceContext.refreshContentTypes();
    trackUnpublishedContentType($scope.contentType);
    return publishedContentType;
  }

  function unpublishErrorHandler (err) {
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
  function trackUnpublishedContentType (contentType) {
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
      var valid = !allFieldsInactive($scope.contentType);
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
      var fieldNames = _.map($scope.contentType.data.fields, 'name');
      notify.invalidAccordingToScope($scope.validationResult.errors, fieldNames);
      return $q.reject();
    }

    return $scope.contentType.save()
    .then(publishContentType)
    .then(function (published) {
      $scope.publishedContentType = published;
      $scope.ctEditorController.registerPublishedFields(published);
      return published;
    })
    .then(saveEditingInterface)
    .catch(triggerApiErrorNotification)
    .then(setPristine)
    .then(function () {
      setPristine();
      previewEnvironmentsCache.clearAll();
      uiConfig.addOrEditCt($scope.contentType);
      if (redirect && $scope.context.isNew) {
        return goToDetails($scope.contentType);
      }
    })
    // Need to do this _after_ redirecting so it is not automatically
    // dismissed.
    .then(notify.saveSuccess);
  }

  // TODO this should be handled by a content type repository
  function publishContentType (contentType) {
    var version = contentType.getVersion();

    return contentType.publish(version)
    .then(function (published) {
      contentType.setPublishedVersion(version);
      spaceContext.registerPublishedContentType(published);

      return spaceContext.editingInterfaces.get(contentType.data);
    }).then(function (editingInterface) {
      // On publish the API also updates the editor interface
      $scope.editingInterface.sys.version = editingInterface.sys.version;

      if (version === 1) {
        spaceContext.refreshContentTypesUntilChanged();
      } else {
        spaceContext.refreshContentTypes();
      }

      return contentType;
    });
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

  function goToDetails (contentType) {
    return $state.go('spaces.detail.content_types.detail', {
      contentTypeId: contentType.getId()
    });
  }

  function triggerApiErrorNotification (errOrErrContainer) {
    notify.saveFailure(errOrErrContainer, $scope.contentType);
    return $q.reject(errOrErrContainer);
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

  function allFieldsInactive (contentType) {
    return _.every(contentType.data.fields, function (field) {
      return field.disabled || field.omitted;
    });
  }

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#duplicate
   * @type {Command}
   */
  controller.duplicate = Command.create(function () {
    return metadataDialog
    .openDuplicateDialog($scope.contentType, duplicate)
    .then(askAboutRedirection)
    .then(notify.duplicateSuccess);
  }, {
    disabled: function () {
      var isNew = $scope.context.isNew;
      var isDenied = accessChecker.shouldDisable('updateContentType') ||
                     accessChecker.shouldDisable('publishContentType');
      var isDirty = $scope.contentTypeForm.$dirty ||
                    !$scope.contentType.getPublishedVersion();
      var isPublished = $scope.contentType.isPublished();

      return isNew || isDenied || isDirty || !isPublished;
    }
  });

  function duplicate (metadata) {
    var duplicate = prepareDuplicate(metadata);

    return duplicate.save()
    .then(publishContentType)
    .then(function (ct) {
      return spaceContext.editingInterfaces.save(ct.data, $scope.editingInterface);
    })
    .then(function () {
      return duplicate;
    }, function (err) {
      notify.duplicateError();
      return $q.reject(err);
    });
  }

  function prepareDuplicate (metadata) {
    var data = $scope.contentType.data;
    return spaceContext.space.newContentType({
      sys: {type: 'ContentType', id: metadata.id},
      name: metadata.name,
      description: metadata.description || '',
      fields: _.cloneDeep(data.fields),
      displayField: data.displayField
    });
  }

  function askAboutRedirection (duplicated) {
    return modalDialog.open({
      title: 'Duplicated content type',
      message: 'Content type was successfully duplicated. What do you want to do now?',
      confirmLabel: 'Go to the duplicated content type',
      cancelLabel: null
    }).promise.then(function () {
      setPristine();
      return goToDetails(duplicated);
    }, _.noop);
  }
}])

.factory('contentType/notifications', ['$injector', function ($injector) {
  var logger = $injector.get('logger');
  var notification = $injector.get('notification');
  var truncate = $injector.get('stringUtils').truncate;

  var saveError = 'Unable to save content type: ';
  var messages = {
    save: {
      success: 'Content type saved successfully',
      invalid: saveError + 'Data is invalid',
      outdated: saveError + 'Your version is outdated. Please reload and try again'
    },
    create: {
      exists: 'A content type with this ID already exists'
    },
    duplicate: {
      success: 'Content type duplicated successfully',
      error: 'Unable to duplicate content type: '
    }
  };

  var self = {
    deleteSuccess: function () {
      notification.info('Content type deleted successfully');
    },

    deleteFail: function (err) {
      notification.error('Deleting content type failed: ' + getServerMessage(err));
      logger.logServerWarn('Error deleting Content Type', {error: err});
    },

    invalidAccordingToScope: function (errors, fieldNames) {
      var fieldErrors = _.filter(errors, function (error) {
        return error.path && error.path[0] === 'fields';
      });

      var errorFieldName = _.first(_.map(fieldErrors, function (error) {
        return fieldNames[error.path[1]];
      }));

      var errorWithoutFieldName = _.first(_.map(errors, function (error) {
        return error.message;
      }));

      if (errorFieldName) {
        notification.error(saveError + 'Invalid field “' + truncate(errorFieldName, 12) + '”');
      } else {
        notification.error(errorWithoutFieldName || messages.save.invalid);
      }
    },

    saveFailure: function (errData, contentType) {
      var err = logger.findActualServerError(errData);
      var errorId = dotty.get(err, 'sys.id');
      if (errorId === 'ValidationFailed') {
        self.saveInvalidError(errData, contentType);
      } else if (errorId === 'VersionMismatch') {
        if (contentType.getVersion()) {
          self.saveOutdatedError(errData, contentType);
        } else {
          self.saveIdExists();
        }
      } else {
        self.saveApiError(errData);
      }
    },

    saveSuccess: function () {
      notification.info(messages.save.success);
    },

    saveInvalidError: function (errData, contentType) {
      notification.error(messages.save.invalid);
      logger.logServerWarn('Error saving invalid Content Type', {
        error: errData,
        contentType: contentType.data
      });
    },

    saveOutdatedError: function (errData, contentType) {
      notification.error(messages.save.outdated);
      logger.logServerWarn('Error activating outdated Content Type', {
        error: errData,
        contentType: contentType.data
      });
    },

    saveIdExists: function () {
      notification.warn(messages.create.exists);
    },

    saveApiError: function (errData) {
      var message = saveError + getServerMessage(errData);
      notification.error(message);
      logger.logServerWarn('Error activating Content Type', {error: errData});
    },

    duplicateSuccess: function () {
      notification.info(messages.duplicate.success);
    },

    duplicateError: function (errData) {
      notification.error(messages.duplicate.error + getServerMessage(errData));
    }
  };

  return self;

  function getServerMessage (errData) {
    var err = logger.findActualServerError(errData);
    return dotty.get(err, 'message') ||
           dotty.get(err, 'sys.id') ||
           'Unknown server error';
  }

}]);
