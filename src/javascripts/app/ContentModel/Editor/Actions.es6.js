import { noop, cloneDeep, assign, map, get } from 'lodash';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as notify from './Notifications.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import { getModule } from 'NgRegistry.es6';
import assureDisplayField from 'data/ContentTypeRepo/assureDisplayField.es6';

const $q = getModule('$q');
const $state = getModule('$state');
const logger = getModule('logger');
const modalDialog = getModule('modalDialog');
const Command = getModule('command');
const spaceContext = getModule('spaceContext');
const closeState = getModule('navigation/closeState');
const metadataDialog = getModule('contentTypeEditor/metadataDialog');
const previewEnvironmentsCache = getModule('data/previewEnvironmentsCache');

/**
 * @description
 * Uses the following scope properties
 *
 * - `contentType` for persistence methods and data access
 * - `publishedContentType` is updated whenever the content type is published or
 *   unpublished. Corresponds to the server data.
 * - `editorInterface` is read and updated on `save`.
 * - `contentTypeForm` is read to check whether the local modal is “dirty”, i.e.
 *   whether the user has made some changes.
 *
 * @param {object} $scope
 * @param {Promise<string[]>} contentTypeIds
 *   A promise that resolves to all the used content type IDs. It is passed to
 *   the duplication dialog to verify new IDs.
 */
export default function create($scope, contentTypeIds) {
  const controller = {};

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  controller.delete = Command.create(startDeleteFlow, {
    available: function() {
      const deletableState =
        !$scope.context.isNew &&
        ($scope.contentType.canUnpublish() || !$scope.contentType.isPublished());
      const denied =
        accessChecker.shouldHide('delete', 'contentType') ||
        accessChecker.shouldHide('unpublish', 'contentType');
      return deletableState && !denied;
    },
    disabled: function() {
      return (
        accessChecker.shouldDisable('delete', 'contentType') ||
        accessChecker.shouldDisable('unpublish', 'contentType')
      );
    }
  });

  function startDeleteFlow() {
    return checkRemovable().then(status => {
      if (status.isRemovable) {
        return confirmRemoval(status.isPublished);
      } else {
        forbidRemoval(status.entryCount);
      }
    }, ReloadNotification.basicErrorHandler);
  }

  function checkRemovable() {
    const isPublished = $scope.contentType.isPublished();
    const canRead = accessChecker.canPerformActionOnEntryOfType('read', $scope.contentType.getId());

    if (!isPublished) {
      return $q.resolve(createStatusObject(true));
    }

    return spaceContext.space
      .getEntries({
        content_type: $scope.contentType.getId()
      })
      .then(
        res => {
          const count = res.length;
          return createStatusObject(canRead && count < 1, count);
        },
        res => {
          if (res.statusCode === 404 && !canRead) {
            return createStatusObject(false);
          } else {
            return $q.reject(res);
          }
        }
      );

    function createStatusObject(isRemovable, entryCount) {
      return {
        isPublished,
        isRemovable,
        entryCount
      };
    }
  }

  function remove(isPublished) {
    const unpub = isPublished ? unpublish() : $q.resolve();
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
      persistOnNavigation: true,
      controller(scope) {
        assign(scope, {
          input: {},
          contentTypeName: $scope.contentType.data.name,
          delete: Command.create(
            () =>
              remove(isPublished).finally(() => {
                scope.dialog.confirm();
              }),
            {
              disabled: () => scope.input.contentTypeName !== scope.contentTypeName
            }
          )
        });
      }
    });
  }

  function trackEnforcedButtonClick(err) {
    // If we get reason(s), that means an enforcement is present
    const reason = get(err, 'body.details.reasons', null);

    Analytics.track('entity_button:click', {
      entityType: 'contentType',
      enforced: Boolean(reason),
      reason
    });

    return $q.reject(err);
  }

  function unpublish() {
    return spaceContext.publishedCTs.unpublish($scope.contentType).then(
      () => {
        $scope.publishedContentType = null;
      },
      err => {
        logger.logServerWarn('Error deactivating Content Type', { error: err });
        return $q.reject(err);
      }
    );
  }

  function sendDeleteRequest() {
    return $scope.contentType.delete().then(() => {
      notify.deleteSuccess();
      return closeState();
    }, notify.deleteFail);
  }

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#scope#cancel
   * @type {Command}
   */
  controller.cancel = Command.create(
    () =>
      // X.detail.fields -> X.list
      $state.go('^.^.list'),
    {
      available: function() {
        return $scope.context.isNew;
      }
    }
  );

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#save
   * @type {Command}
   */
  controller.save = Command.create(() => save(true), {
    disabled: function() {
      const dirty =
        $scope.contentTypeForm.$dirty ||
        $scope.contentType.hasUnpublishedChanges() ||
        !$scope.contentType.getPublishedVersion();
      const valid = !allFieldsInactive($scope.contentType);
      const denied =
        accessChecker.shouldDisable('update', 'contentType') ||
        accessChecker.shouldDisable('publish', 'contentType');

      return !dirty || !valid || denied;
    }
  });

  // This is called by the state manager in case the user leaves the
  // Content Type editor without saving. We do not redirect in that
  // case.
  controller.saveAndClose = () => save(false);

  function save(redirect) {
    assureDisplayField($scope.contentType.data);

    if (!$scope.validate()) {
      const fieldNames = map($scope.contentType.data.fields, 'name');
      notify.invalidAccordingToScope($scope.validationResult.errors, fieldNames);
      return $q.reject();
    }

    return (
      $scope.contentType
        .save()
        .then(publishContentType)
        .then(published => {
          $scope.publishedContentType = cloneDeep(published);
          return published;
        })
        .then(saveEditorInterface)
        .catch(trackEnforcedButtonClick)
        .catch(triggerApiErrorNotification)
        .then(setPristine)
        .then(() => {
          setPristine();
          previewEnvironmentsCache.clearAll();
          spaceContext.uiConfig.addOrEditCt($scope.contentType.data);
          if (redirect && $scope.context.isNew) {
            return goToDetails($scope.contentType);
          }
        })
        // Need to do this _after_ redirecting so it is not automatically
        // dismissed.
        .then(notify.saveSuccess)
    );
  }

  function publishContentType(contentType) {
    return spaceContext.publishedCTs
      .publish(contentType)
      .then(() => spaceContext.editorInterfaceRepo.get(contentType.data))
      .then(editorInterface => {
        // On publish the API also updates the editor interface
        $scope.editorInterface.sys.version = editorInterface.sys.version;
        return contentType;
      });
  }

  function saveEditorInterface(contentType) {
    return spaceContext.editorInterfaceRepo
      .save(contentType.data, $scope.editorInterface)
      .then(editorInterface => {
        $scope.editorInterface = editorInterface;
      });
  }

  function setPristine() {
    // Since this is called by asynchronously the scope data may have
    // already been removed.
    if ($scope.contentTypeForm) {
      $scope.contentTypeForm.$setPristine();
    }
    if ($scope.context) {
      $scope.context.dirty = false;
    }
  }

  function goToDetails(contentType) {
    // X.detail.fields -> X.detail.fields with altered contentTypeId param
    return $state.go('^.^.detail.fields', {
      contentTypeId: contentType.getId()
    });
  }

  function triggerApiErrorNotification(errOrErrContainer) {
    notify.saveFailure(errOrErrContainer, $scope.contentType);
    return $q.reject(errOrErrContainer);
  }

  function allFieldsInactive(contentType) {
    const fields = contentType.data.fields || [];
    return fields.every(field => field.disabled || field.omitted);
  }

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#duplicate
   * @type {Command}
   */
  controller.duplicate = Command.create(
    () =>
      metadataDialog
        .openDuplicateDialog($scope.contentType, createDuplicate, contentTypeIds)
        .then(askAboutRedirection)
        .then(notify.duplicateSuccess),
    {
      disabled: function() {
        const isNew = $scope.context.isNew;
        const isDenied =
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType');
        const isDirty = $scope.contentTypeForm.$dirty || !$scope.contentType.getPublishedVersion();
        const isPublished = $scope.contentType.isPublished();

        return isNew || isDenied || isDirty || !isPublished;
      }
    }
  );

  function createDuplicate(metadata) {
    const data = $scope.contentType.data;
    const duplicate = spaceContext.space.newContentType({
      sys: { type: 'ContentType', id: metadata.id },
      name: metadata.name,
      description: metadata.description || '',
      fields: cloneDeep(data.fields),
      displayField: data.displayField
    });

    return duplicate
      .save()
      .then(publishContentType)
      .then(ct => spaceContext.editorInterfaceRepo.save(ct.data, $scope.editorInterface))
      .then(
        () => duplicate,
        err => {
          notify.duplicateError();
          return $q.reject(err);
        }
      );
  }

  function askAboutRedirection(duplicated) {
    return modalDialog
      .open({
        title: 'Duplicated content type',
        message: 'Content type was successfully duplicated. What do you want to do now?',
        confirmLabel: 'Go to the duplicated content type',
        cancelLabel: null
      })
      .promise.then(() => {
        setPristine();
        return goToDetails(duplicated);
      }, noop);
  }

  return controller;
}
