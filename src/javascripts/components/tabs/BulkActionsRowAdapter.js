import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry';

import * as accessChecker from 'access_control/AccessChecker';
import BulkActionsRow from './BulkActionsRow';
import { noop } from 'lodash';

const isActionVisible = (selectedEntities, action, predicate) => {
  return (
    selectedEntities.length > 0 &&
    selectedEntities.every(
      (entity) => accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]()
    )
  );
};

/**
 * TODO: Remove temporary adapter as soon as the entity list tables are migrated
 * See if batchPerformer.js and Selection.js can be removed/simplified in the process
 */
const BulkActionsRowAdapter = ({
  entityType,
  selectedEntities,
  updateEntities,
  clearSelected,
  onActionComplete,
  ...props
}) => {
  const batchPerformer = getModule('batchPerformer');
  const performer = batchPerformer.create({
    entityType,
    getSelected: () => selectedEntities,
  });

  const handleAction = (func, withUpdate) => async () => {
    const result = await func();
    if (withUpdate) await updateEntities();
    return result;
  };

  const actions = {
    showArchive: () => isActionVisible(selectedEntities, 'archive', 'canArchive'),
    archiveSelected: handleAction(performer.archive),
    showUnarchive: () => isActionVisible(selectedEntities, 'unarchive', 'canUnarchive'),
    unarchiveSelected: handleAction(performer.unarchive),
    showDelete: () => isActionVisible(selectedEntities, 'delete', 'canDelete'),
    deleteSelected: handleAction(performer.delete, true),
    showPublish: () => isActionVisible(selectedEntities, 'publish', 'canPublish'),
    publishSelected: handleAction(performer.publish),
    showUnpublish: () => isActionVisible(selectedEntities, 'unpublish', 'canUnpublish'),
    unpublishSelected: handleAction(performer.unpublish),
  };

  const allowDuplicate = entityType === 'entry';
  if (allowDuplicate) {
    actions.showDuplicate = () =>
      selectedEntities.length > 0 &&
      !accessChecker.shouldHide('create', entityType) &&
      !accessChecker.shouldDisable('create', entityType);
    actions.duplicateSelected = handleAction(performer.duplicate, true);
  }

  return (
    <BulkActionsRow
      {...props}
      onActionComplete={(actionName, result) => {
        clearSelected();
        onActionComplete(actionName, result);
      }}
      actions={actions}
      selectedEntities={selectedEntities}
      entityType={entityType}
    />
  );
};

BulkActionsRowAdapter.propTypes = {
  onActionComplete: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['asset', 'entry']).isRequired,
  selectedEntities: PropTypes.arrayOf(PropTypes.object).isRequired,
  clearSelected: PropTypes.func.isRequired,
  updateEntities: PropTypes.func.isRequired,
  allowDuplicate: PropTypes.bool,
};

BulkActionsRowAdapter.defaultProps = {
  onActionComplete: noop,
  selectedEntities: [],
};

export default BulkActionsRowAdapter;
