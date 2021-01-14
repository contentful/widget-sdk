import * as accessChecker from 'access_control/AccessChecker';
import { useCallback, useMemo } from 'react';
import { createBatchPerformer } from './batchPerformer';

import { compileResultMessages } from './messages';
import { Notification } from '@contentful/forma-36-react-components';
import { openBatchErrorsModal } from './components/BatchErrorsModal';

export const useBulkActions = ({ entityType, entities, updateEntities }) => {
  const performer = useMemo(() => createBatchPerformer({ entityType, entities }), [
    entityType,
    entities,
  ]);

  const isActionVisible = useCallback((entities, action, predicate) => {
    return (
      entities.length > 0 &&
      entities.every(
        (entity) => accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]()
      )
    );
  }, []);

  const displayResults = async ({ results, method, entityType }) => {
    const notificationMessages = await compileResultMessages({ method, results, entityType });

    if (notificationMessages.errors.length === 0 && notificationMessages.success) {
      return Notification.success(notificationMessages.success);
    }

    return openBatchErrorsModal({
      successMessage: notificationMessages.success,
      errorMessages: notificationMessages.errors,
    });
  };

  const handleAction = useCallback(
    (func, withUpdate) => async () => {
      const result = await func();
      const { rawResults, method, entityType } = result;

      if (withUpdate) await updateEntities();

      displayResults({ results: rawResults, method, entityType });

      return result;
    },
    [updateEntities]
  );

  const actions = {
    showArchive: () => isActionVisible(entities, 'archive', 'canArchive'),
    archiveSelected: handleAction(performer.archive),
    showUnarchive: () => isActionVisible(entities, 'unarchive', 'canUnarchive'),
    unarchiveSelected: handleAction(performer.unarchive),
    showDelete: () => isActionVisible(entities, 'delete', 'canDelete'),
    deleteSelected: handleAction(performer.delete, true),
    showPublish: () => isActionVisible(entities, 'publish', 'canPublish'),
    publishSelected: handleAction(performer.publish),
    showUnpublish: () => isActionVisible(entities, 'unpublish', 'canUnpublish'),
    unpublishSelected: handleAction(performer.unpublish),
    updateTagSelected: handleAction(performer.save),
  };

  const allowDuplicate = entityType === 'entry';
  if (allowDuplicate) {
    actions.showDuplicate = () =>
      entities.length > 0 &&
      !accessChecker.shouldHide('create', entityType) &&
      !accessChecker.shouldDisable('create', entityType);
    actions.duplicateSelected = handleAction(performer.duplicate, true);
  }

  return [{ actions }];
};
