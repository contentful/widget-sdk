import {noop, cloneDeep, assign, map} from 'lodash';
import logger from 'logger';
import $q from '$q';
import modalDialog from 'modalDialog';
import Command from 'command';
import spaceContext from 'spaceContext';
import $state from '$state';
import * as accessChecker from 'access_control/AccessChecker';
import ReloadNotification from 'ReloadNotification';
import ctHelpers from 'data/ContentTypes';
import closeState from 'navigation/closeState';
import metadataDialog from 'contentTypeEditor/metadataDialog';
import previewEnvironmentsCache from 'data/previewEnvironmentsCache';
import * as notify from './Notifications';

/**
 * @description
 * Uses the following scope properties
 *
 * - `contentType` for persistence methods and data access
 * - `publishedContentType` is updated whenever the content type is published or
 *   unpublished. Corresponds to the server data.
 * - `editingInterface` is read and updated on `save`.
 * - `contentTypeForm` is read to check whether the local modal is “dirty”, i.e.
 *   whether the user has made some changes.
 *
 * @param {object} $scope
 * @param {Promise<string[]>} contentTypeIds
 *   A promise that resolves to all the used content type IDs. It is passed to
 *   the duplication dialog to verify new IDs.
 */
export default function create ($scope, contentTypeIds) {
  const controller = {};

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  controller.delete = Command.create(startDeleteFlow, {
    available: function () {
      const deletableState = !$scope.context.isNew && (
        $scope.contentType.canUnpublish() ||
        !$scope.contentType.isPublished()
      );
      const denied = accessChecker.shouldHide('deleteContentType') ||
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
    const isPublished = $scope.contentType.isPublished();
    const canRead = accessChecker.canPerformActionOnEntryOfType('read', $scope.contentType.getId());

    if (!isPublished) {
      return $q.resolve(createStatusObject(true));
    }

    return spaceContext.space.getEntries({
      content_type: $scope.contentType.getId()
    }).then(function (res) {
      const count = res.length;
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
    const unpub = isPublished ? unpublish() : $q.resolve();
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
      persistOnNavigation: true,
      controller (scope) {
        assign(scope, {
          input: {},
          contentTypeName: $scope.contentType.data.name,
          delete: Command.create(function () {
            return remove(isPublished)
            .finally(() => {
              scope.dialog.confirm();
            });
          }, {
            disabled: () => scope.input.contentTypeName !== scope.contentTypeName
          })
        });
      }
    });
  }

  function unpublish () {
    return spaceContext.publishedCTs.unpublish($scope.contentType)
      .then(() => {
        $scope.publishedContentType = null;
      }, (err) => {
        logger.logServerWarn('Error deactivating Content Type', {error: err});
        return $q.reject(err);
      });
  }

  function sendDeleteRequest () {
    return $scope.contentType.delete()
    .then(function () {
      notify.deleteSuccess();
      return closeState();
    }, notify.deleteFail);
  }

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#scope#cancel
   * @type {Command}
   */
  controller.cancel = Command.create(function () {
    return $state.go('spaces.detail.content_types.list');
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
      const dirty = $scope.contentTypeForm.$dirty ||
                  $scope.contentType.hasUnpublishedChanges() ||
                  !$scope.contentType.getPublishedVersion();
      const valid = !allFieldsInactive($scope.contentType);
      const denied = accessChecker.shouldDisable('updateContentType') ||
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
    ctHelpers.assureDisplayField($scope.contentType.data);

    if (!$scope.validate()) {
      const fieldNames = map($scope.contentType.data.fields, 'name');
      notify.invalidAccordingToScope($scope.validationResult.errors, fieldNames);
      return $q.reject();
    }

    return $scope.contentType.save()
    .then(publishContentType)
    .then(function (published) {
      $scope.publishedContentType = cloneDeep(published);
      return published;
    })
    .then(saveEditingInterface)
    .catch(triggerApiErrorNotification)
    .then(setPristine)
    .then(function () {
      setPristine();
      previewEnvironmentsCache.clearAll();
      spaceContext.uiConfig.addOrEditCt($scope.contentType.data);
      if (redirect && $scope.context.isNew) {
        return goToDetails($scope.contentType);
      }
    })
    // Need to do this _after_ redirecting so it is not automatically
    // dismissed.
    .then(notify.saveSuccess);
  }

  function publishContentType (contentType) {
    return spaceContext.publishedCTs.publish(contentType)
    .then(function () {
      return spaceContext.editingInterfaces.get(contentType.data);
    }).then(function (editingInterface) {
      // On publish the API also updates the editor interface
      $scope.editingInterface.sys.version = editingInterface.sys.version;
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
    return $state.go('spaces.detail.content_types.detail.fields', {
      contentTypeId: contentType.getId()
    });
  }

  function triggerApiErrorNotification (errOrErrContainer) {
    notify.saveFailure(errOrErrContainer, $scope.contentType);
    return $q.reject(errOrErrContainer);
  }

  function allFieldsInactive (contentType) {
    const fields = contentType.data.fields || [];
    return fields.every((field) => field.disabled || field.omitted);
  }

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#duplicate
   * @type {Command}
   */
  controller.duplicate = Command.create(function () {
    return metadataDialog
    .openDuplicateDialog($scope.contentType, createDuplicate, contentTypeIds)
    .then(askAboutRedirection)
    .then(notify.duplicateSuccess);
  }, {
    disabled: function () {
      const isNew = $scope.context.isNew;
      const isDenied = accessChecker.shouldDisable('updateContentType') ||
                     accessChecker.shouldDisable('publishContentType');
      const isDirty = $scope.contentTypeForm.$dirty ||
                    !$scope.contentType.getPublishedVersion();
      const isPublished = $scope.contentType.isPublished();

      return isNew || isDenied || isDirty || !isPublished;
    }
  });

  function createDuplicate (metadata) {
    const data = $scope.contentType.data;
    const duplicate = spaceContext.space.newContentType({
      sys: {type: 'ContentType', id: metadata.id},
      name: metadata.name,
      description: metadata.description || '',
      fields: cloneDeep(data.fields),
      displayField: data.displayField
    });

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

  function askAboutRedirection (duplicated) {
    return modalDialog.open({
      title: 'Duplicated content type',
      message: 'Content type was successfully duplicated. What do you want to do now?',
      confirmLabel: 'Go to the duplicated content type',
      cancelLabel: null
    }).promise.then(function () {
      setPristine();
      return goToDetails(duplicated);
    }, noop);
  }

  return controller;
}
