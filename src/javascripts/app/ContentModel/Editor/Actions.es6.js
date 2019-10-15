import React from 'react';
import { getModule } from 'NgRegistry.es6';
import { cloneDeep, map, get } from 'lodash';
import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as notify from './Notifications.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import assureDisplayField from 'data/ContentTypeRepo/assureDisplayField.es6';
import * as logger from 'services/logger.es6';
import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer.es6';
import ContentTypeForbiddenRemoval from './Dialogs/ContenTypeForbiddenRemoval.es6';
import DeleteContentTypeDialog from './Dialogs/DeleteContentTypeDialog.es6';
import { openDuplicateContentTypeDialog } from './Dialogs/index.es6';
import { getContentPreview } from 'services/contentPreview';

/**
 * @description
 * Uses the following scope properties
 *
 * - `contentType` for persistence methods and data access
 * - `publishedContentType` is updated whenever the content type is published or
 *   unpublished. Corresponds to the server data.
 * - `editorInterface` is read and updated on `save`.
 * - `context` is read to check whether the user has made some changes.
 *
 * @param {object} $scope
 * @param {string[]} contentTypeIds
 *   A promise that resolves to all the used content type IDs. It is passed to
 *   the duplication dialog to verify new IDs.
 */
export default function create($scope, contentTypeIds) {
  const spaceContext = getModule('spaceContext');
  const $q = getModule('$q');
  const $state = getModule('$state');
  const Command = getModule('command');
  const closeState = getModule('navigation/closeState');

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
        content_type: $scope.contentType.getId(),
        limit: 0
      })
      .then(
        res => {
          const count = res.total;
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
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ContentTypeForbiddenRemoval
        isShown={isShown}
        onClose={onClose}
        entriesCount={count}
        contentTypeName={$scope.contentType.data.name}
      />
    ));
  }

  function confirmRemoval(isPublished) {
    const key = Date.now();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteContentTypeDialog
        key={key}
        contentTypeName={$scope.contentType.data.name}
        isShown={isShown}
        onConfirm={() => {
          return remove(isPublished).finally(() => {
            onClose(true);
          });
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
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
        $scope.context.dirty ||
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

    if (($scope.contentType.data.fields || []).length < 1) {
      notify.saveNoFields();
      return $q.reject();
    }

    return (
      $scope.contentType
        .save()
        .then(contentType => spaceContext.publishedCTs.publish(contentType))
        .then(published => {
          $scope.publishedContentType = cloneDeep(published);

          // When a Content Type is published the CMA automatically
          // updates the Editor Interface. We need to fetch and update
          // the sys of a local entity so we can override it.
          return spaceContext.cma.getEditorInterface(published.data.sys.id);
        })
        .then(remoteEditorInterface => {
          const localEditorInterface = cloneDeep($scope.editorInterface);
          localEditorInterface.sys = remoteEditorInterface.sys;

          return spaceContext.cma.updateEditorInterface(
            EditorInterfaceTransformer.toAPI(
              $scope.publishedContentType.data,
              localEditorInterface,
              $scope.widgets
            )
          );
        })
        .then(editorInterface => {
          $scope.editorInterface = EditorInterfaceTransformer.fromAPI(
            $scope.publishedContentType.data,
            editorInterface,
            $scope.widgets
          );
        })
        .catch(trackEnforcedButtonClick)
        .catch(triggerApiErrorNotification)
        .then(setPristine)
        .then(() => {
          setPristine();
          getContentPreview().clearCache();
          return spaceContext.uiConfig;
        })
        .then(uiConfig => {
          // Try to update UIConfig but proceed if it failed.
          return uiConfig.addOrEditCt($scope.contentType.data).catch(() => {});
        })
        .then(() => {
          if (redirect && $scope.context.isNew) {
            return goToDetails($scope.contentType);
          }
        })
        // Need to do this _after_ redirecting so it is not automatically
        // dismissed.
        .then(notify.saveSuccess)
    );
  }

  function setPristine() {
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
    async () => {
      const duplicatedContentType = await openDuplicateContentTypeDialog(
        $scope.contentType,
        createDuplicate,
        contentTypeIds
      );

      if (!duplicatedContentType) {
        return;
      }

      await askAboutRedirection(duplicatedContentType);

      notify.duplicateSuccess();
    },
    {
      disabled: function() {
        const isNew = $scope.context.isNew;
        const isDenied =
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType');
        const isDirty = $scope.context.dirty || !$scope.contentType.getPublishedVersion();
        const isPublished = $scope.contentType.isPublished();

        return isNew || isDenied || isDirty || !isPublished;
      }
    }
  );

  function createDuplicate({ contentTypeId, name, description }) {
    const data = $scope.contentType.data;
    const duplicate = spaceContext.space.newContentType({
      sys: { type: 'ContentType', id: contentTypeId },
      name: name,
      description: description || '',
      fields: cloneDeep(data.fields),
      displayField: data.displayField
    });

    const editorInterfaceDuplicate = {
      ...cloneDeep($scope.editorInterface),
      sys: {
        id: 'default',
        type: 'EditorInterface',
        version: 1,
        contentType: { sys: { id: contentTypeId } }
      }
    };

    return duplicate
      .save()
      .then(contentType => spaceContext.publishedCTs.publish(contentType))
      .then(published => {
        return spaceContext.cma.updateEditorInterface(
          EditorInterfaceTransformer.toAPI(published.data, editorInterfaceDuplicate, $scope.widgets)
        );
      })
      .then(
        () => duplicate,
        err => {
          notify.duplicateError();
          return $q.reject(err);
        }
      );
  }

  function askAboutRedirection(duplicated) {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        shouldCloseOnEscapePress={false}
        shouldCloseOnOverlayClick={false}
        isShown={isShown}
        onConfirm={onClose}
        onCancel={onClose}
        title="Duplicated content type"
        confirmLabel="Go to the duplicated content type."
        confirmTestId="go-to-duplicated-content-type"
        cancelLabel={null}>
        <Paragraph>Content type was successfully duplicated.</Paragraph>
      </ModalConfirm>
    )).then(() => {
      // mark the form as pristine so we can navigate without confirmation dialog
      setPristine();
      return goToDetails(duplicated);
    });
  }

  return controller;
}