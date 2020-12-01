import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { noop } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { Spinner, TableCell, TableRow } from '@contentful/forma-36-react-components';
import { canUserReadEntities } from 'access_control/AccessChecker';
import { BulkActionLink } from './BulkActionsLink';
import { PluralizeEntityMessage } from '../PluralizeEntityMessage';
import { BulkActionDeleteConfirm } from './BulkActionsDeleteConfirm';
import { TagsBulkAction, useTagsFeatureEnabled } from 'features/content-tags';
import ReleaseDialog from 'app/Releases/ReleasesWidget/ReleasesWidgetDialog';
import { useFeatureFlagAddToRelease } from 'app/Releases/ReleasesFeatureFlag';
import { useBulkActions } from 'core/hooks/useBulkActions';

const styles = {
  /*
    We have to override inline styles set by TableHead.offsetTop
  */
  bulkActionsRow: css({
    top: '22px !important',
    zIndex: tokens.zIndexDefault,
    '> *': { marginRight: tokens.spacingS },
  }),
};

const getPublishLabel = (selectedEntities) => {
  const counts = selectedEntities.reduce(
    (acc, entity) => {
      acc[entity.isPublished() ? 'published' : 'unpublished'] += 1;
      return acc;
    },
    { published: 0, unpublished: 0 }
  );

  if (counts.published === 0) return 'Publish';
  if (counts.unpublished === 0) return 'Republish';
  return '(Re)publish';
};

export const BulkActionsRow = ({
  colSpan,
  selectedEntities,
  entityType,
  onActionComplete,
  updateEntities,
}) => {
  const [pendingMessage, setPendingMessage] = useState(undefined);
  const [isReleaseDialogOpen, openReleaseDialog] = useState(false);
  const [{ actions }] = useBulkActions({
    entityType,
    entities: selectedEntities,
    updateEntities,
  });

  const { addToReleaseEnabled: isReleaseFeatureEnabled } = useFeatureFlagAddToRelease();

  const fireAction = async (actionLabel) => {
    let message;
    let action;
    let actionName = actionLabel;
    switch (actionLabel) {
      case 'duplicate':
        message = 'Duplicating';
        action = actions.duplicateSelected;
        break;
      case 'delete':
        message = 'Deleting';
        action = actions.deleteSelected;
        break;
      case 'archive':
        message = 'Archiving';
        action = actions.archiveSelected;
        break;
      case 'unarchive':
        message = 'Unarchiving';
        action = actions.unarchiveSelected;
        break;
      case 'unpublish':
        message = 'Unpublishing';
        action = actions.unpublishSelected;
        break;
      case 'publish':
      case 'republish':
      case '(re)publish':
        actionName = 'publish';
        message = 'Publishing';
        action = actions.publishSelected;
        break;
      default:
        return;
    }
    setPendingMessage(message);
    const result = await action();
    await onActionComplete(actionName, result);
    setPendingMessage(undefined);
  };

  const { tagsEnabled } = useTagsFeatureEnabled();

  const renderActions = () => {
    const showDuplicate = actions.showDuplicate && actions.showDuplicate();
    const showDelete = actions.showDelete && actions.showDelete();
    const showArchive = actions.showArchive && actions.showArchive();
    const showUnarchive = actions.showUnarchive && actions.showUnarchive();
    const showUnpublish = actions.showUnpublish && actions.showUnpublish();
    const showPublish = actions.showPublish && actions.showPublish();
    const canAddToRelease = canUserReadEntities(selectedEntities);

    const noActionAvailable =
      !showDuplicate &&
      !showDelete &&
      !showArchive &&
      !showUnarchive &&
      !showUnpublish &&
      !showPublish &&
      !tagsEnabled &&
      (!isReleaseFeatureEnabled || !canAddToRelease);

    if (noActionAvailable)
      return <span data-test-id="no-actions-message">No bulk action available</span>;
    return (
      <Fragment>
        <BulkActionLink
          label="Duplicate"
          linkType="secondary"
          onClick={fireAction}
          visible={showDuplicate}
        />
        <BulkActionDeleteConfirm
          itemsCount={selectedEntities.length}
          fireAction={fireAction}
          entityType={entityType}
          visible={showDelete}
        />
        <BulkActionLink
          label="Archive"
          linkType="secondary"
          onClick={fireAction}
          visible={showArchive}
        />
        <BulkActionLink
          label="Unarchive"
          linkType="secondary"
          onClick={fireAction}
          visible={showUnarchive}
        />
        <BulkActionLink
          label="Unpublish"
          linkType="secondary"
          onClick={fireAction}
          visible={showUnpublish}
        />
        <BulkActionLink
          label={getPublishLabel(selectedEntities)}
          linkType="positive"
          onClick={fireAction}
          visible={showPublish}
        />
        {isReleaseFeatureEnabled ? (
          <BulkActionLink
            label="Add to release"
            linkType="secondary"
            onClick={() => openReleaseDialog(true)}
            visible={canAddToRelease}
          />
        ) : null}
        <BulkActionLink
          label="Add or remove tags"
          linkType="secondary"
          onClick={() => TagsBulkAction(selectedEntities, updateEntities)}
          visible={tagsEnabled}
        />
      </Fragment>
    );
  };

  const selectedCount = selectedEntities.length;

  if (selectedCount <= 0) return null;
  return (
    <TableRow testId="bulk-actions">
      <TableCell colSpan={colSpan} className={styles.bulkActionsRow}>
        {pendingMessage ? (
          <Fragment>
            {pendingMessage}{' '}
            <PluralizeEntityMessage entityType={entityType} count={selectedCount} />
            <Spinner />
          </Fragment>
        ) : (
          <Fragment>
            <PluralizeEntityMessage
              testId="label"
              entityType={entityType}
              restOfTheMsg="selected:"
              count={selectedCount}
            />
            {renderActions()}
            {isReleaseFeatureEnabled && isReleaseDialogOpen ? (
              <ReleaseDialog
                selectedEntities={selectedEntities.map((entry) => entry.data)}
                onCancel={() => openReleaseDialog(false)}
                releaseContentTitle={`${selectedEntities.length} selected entities`}
              />
            ) : null}
          </Fragment>
        )}
      </TableCell>
    </TableRow>
  );
};

BulkActionsRow.propTypes = {
  colSpan: PropTypes.number.isRequired,
  updateEntities: PropTypes.func.isRequired,
  selectedEntities: PropTypes.arrayOf(PropTypes.object).isRequired,
  onActionComplete: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
};

BulkActionsRow.defaultProps = {
  onActionComplete: noop,
};