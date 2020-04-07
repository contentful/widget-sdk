import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TableRow, TableCell, Spinner } from '@contentful/forma-36-react-components';
import BulkActionLink from './BulkActionLink';
import PluralizeEntityMessage from './PluralizeEntityMessage';
import BulkActionDeleteConfirm from './BulkActionDeleteConfirm';
import { noop } from 'lodash';

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

class BulkActionsRow extends Component {
  state = {
    pendingMessage: undefined,
  };

  fireAction = async (actionLabel) => {
    const { actions, onActionComplete } = this.props;
    let pendingMessage;
    let action;
    let actionName = actionLabel;
    switch (actionLabel) {
      case 'duplicate':
        pendingMessage = 'Duplicating';
        action = actions.duplicateSelected;
        break;
      case 'delete':
        pendingMessage = 'Deleting';
        action = actions.deleteSelected;
        break;
      case 'archive':
        pendingMessage = 'Archiving';
        action = actions.archiveSelected;
        break;
      case 'unarchive':
        pendingMessage = 'Unarchiving';
        action = actions.unarchiveSelected;
        break;
      case 'unpublish':
        pendingMessage = 'Unpublishing';
        action = actions.unpublishSelected;
        break;
      case 'publish':
      case 'republish':
      case '(re)publish':
        actionName = 'publish';
        pendingMessage = 'Publishing';
        action = actions.publishSelected;
        break;
      default:
        return;
    }
    this.setState({ pendingMessage });
    const result = await action();
    await onActionComplete(actionName, result);
    this.setState({ pendingMessage: undefined });
  };

  renderActions = () => {
    const { actions, selectedEntities, entityType } = this.props;

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
          onClick={this.fireAction}
          visible={actions.showDuplicate && actions.showDuplicate()}
        />
        <BulkActionDeleteConfirm
          itemsCount={selectedEntities.length}
          fireAction={this.fireAction}
          entityType={entityType}
          visible={actions.showDelete && actions.showDelete()}
        />
        <BulkActionLink
          label="Archive"
          linkType="secondary"
          onClick={this.fireAction}
          visible={actions.showArchive && actions.showArchive()}
        />
        <BulkActionLink
          label="Unarchive"
          linkType="secondary"
          onClick={this.fireAction}
          visible={actions.showUnarchive && actions.showUnarchive()}
        />
        <BulkActionLink
          label="Unpublish"
          linkType="secondary"
          onClick={this.fireAction}
          visible={actions.showUnpublish && actions.showUnpublish()}
        />
        <BulkActionLink
          label={getPublishLabel(selectedEntities)}
          linkType="positive"
          onClick={this.fireAction}
          visible={actions.showPublish && actions.showPublish()}
        />
      </Fragment>
    );
  };

  render() {
    const { colSpan, selectedEntities, entityType } = this.props;
    const { pendingMessage } = this.state;
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
              {this.renderActions()}
            </Fragment>
          )}
        </TableCell>
      </TableRow>
    );
  }
}

const requiredConditional = (showFunc) => (props, propName, componentName) => {
  const propValue = props[propName];
  if (props[showFunc] && (propValue === undefined || typeof propValue !== 'function')) {
    return new Error(
      `If the prop \`${showFunc}\` is set, the prop \`${propName}\` (of type \`function\`) is marked as required in \`${componentName}\`, but its value is \`${propValue}\`.`
    );
  }
};

BulkActionsRow.propTypes = {
  colSpan: PropTypes.number.isRequired,
  selectedEntities: PropTypes.arrayOf(PropTypes.object).isRequired,
  onActionComplete: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  actions: PropTypes.shape({
    showDuplicate: PropTypes.func,
    duplicateSelected: requiredConditional('showDuplicate'),
    showArchive: PropTypes.func,
    archiveSelected: requiredConditional('showArchive'),
    showUnarchive: PropTypes.func,
    unarchiveSelected: requiredConditional('showUnarchive'),
    showDelete: PropTypes.func,
    deleteSelected: requiredConditional('showDelete'),
    showPublish: PropTypes.func,
    publishSelected: requiredConditional('showPublish'),
    showUnpublish: PropTypes.func,
    unpublishSelected: requiredConditional('showUnpublish'),
  }).isRequired,
};

BulkActionsRow.defaultProps = {
  onActionComplete: noop,
};

export default BulkActionsRow;
