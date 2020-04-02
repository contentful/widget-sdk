import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry';

import * as accessChecker from 'access_control/AccessChecker';
import BulkActionsRow from './BulkActionsRow';
import { noop } from 'lodash';

const isActionVisible = (selection, action, predicate) => {
  const selectedEntities = selection.getSelected();
  if (selectedEntities.length <= 0) return false;
  return selectedEntities.every(
    (entity) => accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]()
  );
};

/**
 * TODO: Remove temporary adapter as soon as the entity list tables are migrated
 * See if batchPerformer.js and Selection.js can be removed/simplified in the process
 */
const BulkActionsRowAdapter = ({
  entityType,
  selection,
  updateEntities,
  allowDuplicate,
  onActionComplete,
  ...props
}) => {
  const batchPerformer = getModule('batchPerformer');
  const performer = batchPerformer.create({
    entityType,
    getSelected: selection.getSelected,
  });

  const lowerEntityType = entityType.toLowerCase();

  const handleAction = (func, withUpdate) => async () => {
    const result = await func();
    if (withUpdate) await updateEntities();
    return result;
  };

  const actions = {
    showArchive: () => isActionVisible(selection, 'archive', 'canArchive'),
    archiveSelected: handleAction(performer.archive),
    showUnarchive: () => isActionVisible(selection, 'unarchive', 'canUnarchive'),
    unarchiveSelected: handleAction(performer.unarchive),
    showDelete: () => isActionVisible(selection, 'delete', 'canDelete'),
    deleteSelected: handleAction(performer.delete, true),
    showPublish: () => isActionVisible(selection, 'publish', 'canPublish'),
    publishSelected: handleAction(performer.publish),
    showUnpublish: () => isActionVisible(selection, 'unpublish', 'canUnpublish'),
    unpublishSelected: handleAction(performer.unpublish),
  };

  if (allowDuplicate) {
    actions.showDuplicate = () =>
      selection.getSelected().length > 0 &&
      !accessChecker.shouldHide('create', lowerEntityType) &&
      !accessChecker.shouldDisable('create', lowerEntityType);
    actions.duplicateSelected = handleAction(performer.duplicate, true);
  }

  return (
    <BulkActionsRow
      {...props}
      onActionComplete={(actionName, result) => {
        selection.clear();
        onActionComplete(actionName, result);
      }}
      actions={actions}
      selectedEntities={selection.getSelected()}
      entityType={lowerEntityType}
    />
  );
};

BulkActionsRowAdapter.propTypes = {
  onActionComplete: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['Asset', 'Entry']).isRequired,
  selection: PropTypes.object.isRequired,
  updateEntities: PropTypes.func.isRequired,
  allowDuplicate: PropTypes.bool,
};

BulkActionsRowAdapter.defaultProps = {
  onActionComplete: noop,
};

export default BulkActionsRowAdapter;
