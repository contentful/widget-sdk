import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TableRow, TableCell, Spinner } from '@contentful/forma-36-react-components';
import BulkActionLink from './BulkActionLink';
import PluralizeEntityMessage from './PluralizeEntityMessage';
import BulkActionDeleteConfirm from './BulkActionDeleteConfirm';
import { noop } from 'lodash';
import useBulkActions from './useBulkActions';

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

const BulkActionsRow = ({
  colSpan,
  selectedEntities,
  entityType,
  onActionComplete,
  updateEntities,
}) => {
  const [pendingMessage, setPendingMessage] = useState(undefined);
  const [{ actions }] = useBulkActions({
    entityType,
    entities: selectedEntities,
    updateEntities,
  });

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

  const renderActions = () => {
    const showDuplicate = actions.showDuplicate && actions.showDuplicate();
    const showDelete = actions.showDelete && actions.showDelete();
    const showArchive = actions.showArchive && actions.showArchive();
    const showUnarchive = actions.showUnarchive && actions.showUnarchive();
    const showUnpublish = actions.showUnpublish && actions.showUnpublish();
    const showPublish = actions.showPublish && actions.showPublish();

    const noActionAvailable =
      !showDuplicate &&
      !showDelete &&
      !showArchive &&
      !showUnarchive &&
      !showUnpublish &&
      !showPublish;

    if (noActionAvailable)
      return <span data-test-id="no-actions-message">No bulk action available</span>;
    return (
      <Fragment>
        <BulkActionLink
          label="Duplicate"
          linkType="secondary"
          onClick={fireAction}
          visible={actions.showDuplicate && actions.showDuplicate()}
        />
        <BulkActionDeleteConfirm
          itemsCount={selectedEntities.length}
          fireAction={fireAction}
          entityType={entityType}
          visible={actions.showDelete && actions.showDelete()}
        />
        <BulkActionLink
          label="Archive"
          linkType="secondary"
          onClick={fireAction}
          visible={actions.showArchive && actions.showArchive()}
        />
        <BulkActionLink
          label="Unarchive"
          linkType="secondary"
          onClick={fireAction}
          visible={actions.showUnarchive && actions.showUnarchive()}
        />
        <BulkActionLink
          label="Unpublish"
          linkType="secondary"
          onClick={fireAction}
          visible={actions.showUnpublish && actions.showUnpublish()}
        />
        <BulkActionLink
          label={getPublishLabel(selectedEntities)}
          linkType="positive"
          onClick={fireAction}
          visible={actions.showPublish && actions.showPublish()}
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

export default BulkActionsRow;
