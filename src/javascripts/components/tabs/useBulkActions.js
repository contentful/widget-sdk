import { useMemo } from 'react';
import { createBatchPerformer } from './batchPerformer';
import * as accessChecker from 'access_control/AccessChecker';

const isActionVisible = (entities, action, predicate) => {
  return (
    entities.length > 0 &&
    entities.every(
      (entity) => accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]()
    )
  );
};

const useBulkActions = ({ entityType, entities, updateEntities }) => {
  const performer = useMemo(() => createBatchPerformer({ entityType, entities }), [
    entityType,
    entities,
  ]);

  const handleAction = (func, withUpdate) => async () => {
    const result = await func();
    if (withUpdate) await updateEntities();
    return result;
  };

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

export default useBulkActions;
