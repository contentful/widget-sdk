import React from 'react';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import { caseofEq as caseof, otherwise } from 'sum-types';
import { State, Action } from 'data/CMA/EntityState';
import { Notification, makeNotify } from 'app/entity_editor/Notifications';
import { captureError } from 'core/monitoring';

import * as trackVersioning from 'analytics/events/versioning';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as random from 'utils/Random';

import StateChangeConfirmationDialog from 'app/entity_editor/Components/StateChangeConfirmationDialog';
import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import * as Analytics from 'analytics/Analytics';
import { createCommand } from 'utils/command/command';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';

// Truncate titles that are longer than a Symbol length
const MAX_TITLE_LENGTH = 256;

export const state = {
  ARCHIVED: State.Archived(),
  CHANGED: State.Changed(),
  DELETED: State.Deleted(),
};

export const initStateController = ({
  bulkEditorContext,
  entityInfo,
  editorData,
  doc,
  validator,
  onUpdate,
  spaceId,
  environmentId,
  contentTypes,
}) => {
  const { permissions, reverter, resourceState: docStateManager } = doc;

  const notify = (notification, data = editorData.entity.data) => {
    const fullTitle = EntityFieldValueSpaceContext.entityTitle({
      getType: () => entityInfo.type,
      getContentTypeId: () => entityInfo.contentTypeId,
      data,
    });
    const title = _.truncate(fullTitle || 'Untitled', { length: MAX_TITLE_LENGTH });
    makeNotify(entityInfo.type, () => `“${title}”`)(notification);
  };

  const controller = {
    inProgress: false,
    hidePrimary: false,
    isDeleted: false, // Is set to 'true' when the entity has been deleted by another user.
  };

  controller.delete = createCommand(
    async () => {
      const { action } = await applyActionWithConfirmation(Action.Delete());
      if (action !== Action.Archive()) {
        goToPreviousSlideOrExit('delete');
      }
    },
    {
      disabled: function () {
        const canDelete = permissions.can('delete');
        const canMoveToDraft = caseof(controller.current, [
          [state.ARCHIVED, _.constant(permissions.can('unarchive'))],
          [state.CHANGED, state.PUBLISHED, _.constant(permissions.can('unpublish'))],
          [otherwise, _.constant(true)],
        ]);

        return controller.isDeleted || !canDelete || !canMoveToDraft;
      },
    }
  );

  controller.revertToPrevious = createCommand(
    async () => {
      try {
        await reverter.revert();
        notify(Notification.Success('revert'));
        Analytics.track('entity_state:revert', {
          id: entityInfo.id,
          type: entityInfo.type,
        });
      } catch (error) {
        notify(Notification.Error('revert', error));
      }
    },
    {
      available: function () {
        const canEdit = K.getValue(doc.state.canEdit$);
        return canEdit && reverter.hasChanges();
      },
    }
  );

  const onUpdateState = ({
    current = controller.current,
    primary = controller.primary,
    secondary = controller.secondary,
    allActions = controller.allActions,
    isDeleted = controller.isDeleted || false,
    hidePrimary = controller.hidePrimary || false,
  }) => {
    controller.current = current;
    controller.primary = primary;
    controller.secondary = secondary;
    controller.allActions = allActions;
    controller.isDeleted = isDeleted;
    controller.hidePrimary = hidePrimary;

    const secondaryActionsDisabled = _.every(
      controller.secondary,
      (
        cmd // TODO this uses the private API
      ) => cmd._isDisabled()
    );
    controller.secondaryActionsDisabled = secondaryActionsDisabled;

    onUpdate(controller);
  };

  K.onValue(docStateManager.inProgress$, (inProgress) => {
    controller.inProgress = inProgress;
    onUpdate(controller);
  });

  const noop = createCommand(() => {});

  const archive = createCommand(
    () => applyActionWithConfirmation(Action.Archive()),
    {
      disabled: checkDisallowed(Action.Archive()),
      restricted: checkRestricted(Action.Archive()),
    },
    {
      label: 'Archive',
      status: 'Archived',
      targetStateId: 'archived',
    }
  );

  const unarchive = createCommand(
    () => applyAction(Action.Unarchive()),
    {
      disabled: checkDisallowed(Action.Unarchive()),
      restricted: checkRestricted(Action.Unarchive()),
    },
    {
      label: 'Unarchive',
      status: 'Draft',
      targetStateId: 'draft',
    }
  );

  const unpublish = createCommand(
    () => applyActionWithConfirmation(Action.Unpublish()),
    {
      disabled: checkDisallowed(Action.Unpublish()),
      restricted: checkRestricted(Action.Unpublish()),
    },
    {
      label: 'Unpublish',
      status: 'Draft',
      targetStateId: 'draft',
    }
  );

  const publishChanges = createCommand(
    publishEntity,
    {
      disabled: checkDisallowed(Action.Publish()),
      restricted: checkRestricted(Action.Publish()),
    },
    {
      label: 'Publish changes',
      targetStateId: 'published',
    }
  );

  const publish = createCommand(
    publishEntity,
    {
      disabled: checkDisallowed(Action.Publish()),
      restricted: checkRestricted(Action.Publish()),
    },
    {
      label: 'Publish',
      status: 'Published',
      targetStateId: 'published',
    }
  );

  K.onValue(docStateManager.state$, (stateValue) => {
    caseof(stateValue, [
      [
        State.Archived(),
        (s) =>
          onUpdateState({
            current: s,
            primary: unarchive,
            secondary: [publish],
            allActions: [unarchive, publish],
          }),
      ],
      [
        State.Draft(),
        (s) =>
          onUpdateState({
            current: s,
            primary: publish,
            secondary: [archive],
            allActions: [publish, archive],
          }),
      ],
      [
        State.Published(),
        (s) =>
          onUpdateState({
            current: s,
            primary: noop,
            secondary: [unpublish, archive],
            allActions: [unpublish, archive],
            hidePrimary: true,
          }),
      ],
      [
        State.Changed(),
        (s) =>
          onUpdateState({
            current: s,
            primary: publishChanges,
            secondary: [unpublish, archive],
            allActions: [publishChanges, unpublish, archive],
          }),
      ],
      [
        State.Deleted(),
        (s) =>
          onUpdateState({
            current: s,
            isDeleted: true,
          }),
      ],
    ]);
  });

  async function publishEntity() {
    try {
      const confirmed = await showUnpublishedReferencesWarning({
        entity: K.getValue(doc.data$),
        spaceId,
        environmentId,
        contentTypes,
      });

      if (!confirmed) {
        return;
      }

      if (validator.run()) {
        try {
          const { entity } = await applyAction(Action.Publish());

          let contentType;
          if (entityInfo.type === 'Entry') {
            contentType = contentTypes.find((ct) => ct.sys.id === entityInfo.contentTypeId);
          }
          if (contentType) {
            let eventOrigin = 'entry-editor';

            if (bulkEditorContext) {
              eventOrigin = 'bulk-editor';
            }

            const widgetTrackingContexts = _.get(editorData, ['widgetTrackingContexts'], []);
            Analytics.track('entry:publish', {
              eventOrigin,
              widgetTrackingContexts,
              contentType: contentType,
              response: entity,
            });
          }
          trackVersioning.publishedRestored(entity);
        } catch (error) {
          validator.setApiResponseErrors(error);
        }
      } else {
        notify(Notification.ValidationError());
      }
    } catch (error) {
      captureError(error);
    }
  }

  // TODO Move these checks into the document resource manager
  function checkDisallowed(action) {
    return () => controller.isDeleted || !permissions.can(action);
  }

  function checkRestricted(action) {
    return () => !permissions.can(action);
  }

  async function applyAction(action) {
    try {
      const data = await docStateManager.apply(action);
      notify(Notification.Success(action), data);
      return { action, entity: data };
    } catch (error) {
      notify(Notification.Error(action, error));
      throw error;
    }
  }

  async function applyActionWithConfirmation(action) {
    const payload = await showConfirmationMessage({ action });
    return applyAction(_.get(payload, 'action', action));
  }

  async function showConfirmationMessage(props) {
    const result = await ModalLauncher.open(({ isShown, onClose }) => (
      <StateChangeConfirmationDialog
        dialogSessionId={random.id()}
        isShown={isShown}
        action={props.action}
        entityInfo={entityInfo}
        onConfirm={() => onClose({ action: props.action })}
        onCancel={() => onClose({ action: null })}
        onArchive={() => onClose({ action: Action.Archive() })}
      />
    ));

    if (result.action) {
      return result;
    }
    throw new Error();
  }
};
