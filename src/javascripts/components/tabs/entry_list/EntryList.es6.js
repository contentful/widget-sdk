import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';

import cn from 'classnames';
import { range } from 'lodash';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  TextLink,
  ModalConfirm,
  Paragraph,
  SkeletonContainer,
  SkeletonBodyText,
  Spinner
} from '@contentful/forma-36-react-components';

import tokens from '@contentful/forma-36-tokens';
import { Icon } from '@contentful/forma-36-react-components';

import isHotkey from 'is-hotkey';
import StateLink from 'app/common/StateLink.es6';

import ViewCustomizer from './ViewCustomizer/index.es6';
import DisplayField from './DisplayField.es6';
import SecretiveLink from 'components/shared/SecretiveLink.es6';

import { EntityStatusTag } from 'components/shared/EntityStatusTag.es6';

import { isEdge } from 'utils/browser.es6';
const isEdgeBrowser = isEdge();

import { css } from 'emotion';

import * as EntityState from 'data/CMA/EntityState.es6';

const styles = {
  flexCenter: css({
    display: 'flex',
    alignItems: 'center'
  }),
  justifySpaceBetween: css({
    justifyContent: 'space-between'
  }),
  table: css({
    tableLayout: 'fixed'
  }),

  tableCell: css({}),
  marginRightXS: css({
    marginRight: tokens.spacing2Xs
  }),
  marginBottomXXS: css({
    marginBottom: '0.25rem'
  }),
  fullWidth: css({
    width: '100%'
  }),
  sortable: css({
    '&:focus': {
      zIndex: 1
    },
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: tokens.colorElementLight
    }
  }),
  highlight: css({
    backgroundColor: tokens.colorIceMid
  }),
  activeSort: css({
    fontWeight: tokens.fontWeightDemiBold
  }),
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }),
  /*
    We want to make area around checkbox clickable
  */
  nameCell: css({
    paddingTop: 0,
    paddingBottom: 0
  }),
  /*
    TODO: consolidate with #grid tokens
  */
  mediumCell: css({
    width: '15%'
  }),
  largeCell: css({
    width: '21%'
  }),

  /*
    We use visibility:hidden to preserve column width during search, sorting, or pagination.
  */
  visibilityHidden: css({
    visibility: 'hidden'
  }),
  /*
    We have to override inline styles set by TableHead.offsetTop
  */
  bulkActionsRow: css({
    top: '22px !important'
  })
};

function SortableTableCell({
  children,
  isSortable,
  isActiveSort,
  onClick,
  direction,
  className,
  ...rest
}) {
  return (
    <TableCell
      tabIndex={isSortable ? '0' : '-1'}
      className={cn(className, {
        [styles.sortable]: isSortable,
        [styles.activeSort]: isActiveSort
      })}
      onKeyDown={e => {
        if (isTargetInput(e) || e.target.tagName === 'LABEL') {
          return;
        }
        if (isHotkey(['enter', 'space'], e)) {
          onClick(e);
          e.preventDefault();
        }
      }}
      onClick={e => {
        if (isTargetInput(e)) {
          return;
        }
        onClick();
      }}
      {...rest}>
      <span className={styles.flexCenter}>
        {children}
        {isSortable && isActiveSort && (
          <IconButton
            tabIndex="-1"
            className="f36-margin-left--xs"
            buttonType="muted"
            iconProps={{
              icon: direction === 'ascending' ? 'ArrowDown' : 'ArrowUp'
            }}
          />
        )}
      </span>
    </TableCell>
  );
}

SortableTableCell.propTypes = {
  className: PropTypes.string,
  isSortable: PropTypes.bool,
  isActiveSort: PropTypes.bool,
  direction: PropTypes.oneOf(['ascending', 'descending']),
  onClick: PropTypes.func.isRequired
};

function DeleteEntryConfirm({ itemsCount, onCancel, onConfirm }) {
  return (
    <ModalConfirm
      title={`Delete ${pluralize('entry', itemsCount, true)}`}
      isShown={true}
      intent="negative"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      confirmTestId="delete-entry-confirm"
      cancelTestId="delete-entry-cancel"
      onCancel={onCancel}
      onConfirm={onConfirm}>
      <Paragraph>Do you really want to delete {pluralize('entry', itemsCount, true)}?</Paragraph>
    </ModalConfirm>
  );
}

DeleteEntryConfirm.propTypes = {
  itemsCount: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export class BulkActionsRow extends React.Component {
  state = { pendingMessage: undefined, isConfirmVisible: false };

  static propTypes = {
    colSpan: PropTypes.number.isRequired,
    actions: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired
  };

  getPendingMessage = pendingAction => {
    const { selection } = this.props;
    return `${pendingAction} ${pluralize('entry', selection.size(), true)}`;
  };

  setConfirmVisibility = isConfirmVisible => this.setState({ isConfirmVisible });

  fireAction = async actionName => {
    const { actions } = this.props;
    let pendingMessage;
    let action;

    switch (actionName) {
      case 'duplicate':
        pendingMessage = this.getPendingMessage('Duplicating');
        action = actions.duplicateSelected;
        break;
      case 'delete':
        pendingMessage = this.getPendingMessage('Deleting');
        action = actions.deleteSelected;
        break;
      case 'archive':
        pendingMessage = this.getPendingMessage('Archiving');
        action = actions.archiveSelected;
        break;
      case 'unarchive':
        pendingMessage = this.getPendingMessage('Unarchiving');
        action = actions.unarchiveSelected;
        break;
      case 'unpublish':
        pendingMessage = this.getPendingMessage('Unpublishing');
        action = actions.unpublishSelected;
        break;
      case 'publish':
        pendingMessage = this.getPendingMessage('Publishing');
        action = actions.publishSelected;
        break;
      default:
        return;
    }
    this.setState({ pendingMessage });
    await action();
    this.setState({ pendingMessage: undefined });
  };

  render() {
    const { isConfirmVisible, pendingMessage } = this.state;
    const { colSpan, actions, selection } = this.props;
    return (
      <TableRow testId="bulk-actions">
        {pendingMessage && (
          <TableCell colSpan={colSpan} className={styles.bulkActionsRow}>
            {pendingMessage} <Spinner />
          </TableCell>
        )}
        {!pendingMessage && (
          <TableCell colSpan={colSpan} className={styles.bulkActionsRow}>
            <span className="f36-margin-right--s" data-test-id="label">
              {pluralize('entry', selection.size(), true)} selected:
            </span>
            {actions.showDuplicate && actions.showDuplicate() && (
              <TextLink
                className="f36-margin-right--s"
                linkType="secondary"
                testId="duplicate"
                onClick={() => this.fireAction('duplicate')}>
                Duplicate
              </TextLink>
            )}

            {actions.showDelete && actions.showDelete() && (
              <React.Fragment>
                <TextLink
                  className="f36-margin-right--s"
                  linkType="negative"
                  onClick={() => this.setConfirmVisibility(true)}
                  testId="delete">
                  Delete
                </TextLink>
                {isConfirmVisible && (
                  <DeleteEntryConfirm
                    itemsCount={selection.size()}
                    onConfirm={() => {
                      this.fireAction('delete');
                      this.setConfirmVisibility(false);
                    }}
                    onCancel={() => this.setConfirmVisibility(false)}
                  />
                )}
              </React.Fragment>
            )}
            {actions.showArchive && actions.showArchive() && (
              <TextLink
                className="f36-margin-right--s"
                linkType="secondary"
                testId="archive"
                onClick={() => this.fireAction('archive')}>
                Archive
              </TextLink>
            )}
            {actions.showUnarchive && actions.showUnarchive() && (
              <TextLink
                className="f36-margin-right--s"
                linkType="secondary"
                testId="unarchive"
                onClick={() => this.fireAction('unarchive')}>
                Unarchive
              </TextLink>
            )}
            {actions.showUnpublish && actions.showUnpublish() && (
              <TextLink
                className="f36-margin-right--s"
                linkType="secondary"
                testId="unpublish"
                onClick={() => this.fireAction('unpublish')}>
                Unpublish
              </TextLink>
            )}
            {actions.showPublish && actions.showPublish() && (
              <TextLink
                className="f36-margin-right--s"
                linkType="positive"
                testId="publish"
                onClick={() => this.fireAction('publish')}>
                {actions.publishButtonName()}
              </TextLink>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  }
}

export default function EntryList({
  context,
  displayedFields = [],
  displayFieldForFilteredContentType,
  fieldIsSortable,
  isOrderField,
  orderColumnBy,
  entryTitleFormatter,
  contentTypeNameFormatter,
  hiddenFields,
  removeDisplayField,
  addDisplayField,
  toggleContentType,
  updateFieldOrder,
  selection,
  entries = [],
  actions,
  entryCache,
  assetCache,
  jobs = []
}) {
  const hasContentTypeSelected = !!context.view.contentTypeId;

  // can be undefined
  const displayFieldName = displayFieldForFilteredContentType();

  const isContentTypeVisible = !hasContentTypeSelected && !context.view.contentTypeHidden;
  const selectAll = (
    <Checkbox
      id="select-all"
      name="select-all"
      className={cn('f36-margin-right--xs', styles.marginBottomXXS)}
      onChange={e => {
        selection.toggleList(entries, e);
      }}
    />
  );

  const columnLength =
    // if no ct selected = 2 cols, otherwise = 1
    (hasContentTypeSelected ? 1 : 2) +
    // all displayed fields
    displayedFields.length +
    // status column
    1;

  return (
    <Table className={styles.table} testId="entry-list" aria-label="Content Search Results">
      <TableHead offsetTop={isEdgeBrowser ? '0px' : '-20px'} isSticky>
        <TableRow testId="column-names">
          <SortableTableCell
            className={styles.largeCell}
            isSortable={
              hasContentTypeSelected && displayFieldName && fieldIsSortable(displayFieldName)
            }
            isActiveSort={displayFieldName && isOrderField(displayFieldName)}
            onClick={() => {
              if (displayFieldName && fieldIsSortable(displayFieldName)) {
                orderColumnBy(displayFieldName);
              }
            }}
            direction={context.view.order.direction}
            testId="name">
            <label htmlFor="select-all" className="f36-padding-left--s">
              {selectAll}
              Name
            </label>
          </SortableTableCell>
          {!hasContentTypeSelected && isContentTypeVisible && (
            <TableCell testId="content-type" className={styles.mediumCell}>
              Content Type
            </TableCell>
          )}

          {displayedFields.map(field => {
            return (
              <SortableTableCell
                key={field.id}
                isSortable={fieldIsSortable(field)}
                isActiveSort={isOrderField(field)}
                onClick={() => {
                  fieldIsSortable(field) && orderColumnBy(field);
                }}
                direction={context.view.order.direction}
                aria-label={field.name}
                testId={field.name}
                className={styles.mediumCell}>
                {field.name}
              </SortableTableCell>
            );
          })}
          <TableCell testId="status" className={styles.mediumCell}>
            <span className={cn(styles.flexCenter, styles.justifySpaceBetween)}>
              Status
              <ViewCustomizer
                displayedFields={displayedFields}
                hiddenFields={hiddenFields}
                removeDisplayField={removeDisplayField}
                addDisplayField={addDisplayField}
                toggleContentType={toggleContentType}
                isContentTypeHidden={!context.view.contentTypeId && context.view.contentTypeHidden}
                updateFieldOrder={updateFieldOrder}
              />
            </span>
          </TableCell>
        </TableRow>
        {!selection.isEmpty() && (
          <BulkActionsRow colSpan={columnLength} actions={actions} selection={selection} />
        )}
      </TableHead>
      <TableBody>
        {(context.isSearching || entries.length === 0) &&
          range(0, entries.length || 10).map((_, i) => {
            return (
              <TableRow key={i}>
                <TableCell colSpan={columnLength}>
                  <SkeletonContainer svgHeight={tokens.spacingM}>
                    <SkeletonBodyText numberOfLines={1} />
                  </SkeletonContainer>
                </TableCell>
              </TableRow>
            );
          })}
        {entries.map(entry => (
          <StateLink to="^.detail" params={{ entryId: entry.getId() }} key={entry.getId()}>
            {({ onClick, getHref }) => {
              return (
                <TableRow
                  tabIndex="0"
                  onClick={e => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    onClick(e);
                  }}
                  onKeyDown={e => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    if (isHotkey(['enter', 'space'], e)) {
                      onClick(e);
                      e.preventDefault();
                    }
                  }}
                  className={cn('ctf-ui-cursor--pointer', {
                    [styles.highlight]: selection.isSelected(entry),
                    [styles.visibilityHidden]: context.isSearching
                  })}
                  testId="entry-row">
                  <TableCell
                    testId="name"
                    className={cn(styles.tableCell, styles.nameCell, styles.largeCell)}>
                    <span className={styles.flexCenter}>
                      <label className="f36-padding-left--s f36-padding-top--m f36-padding-bottom--m">
                        <Checkbox
                          className={cn('f36-margin-right--xs', styles.marginBottomXXS)}
                          checked={selection.isSelected(entry)}
                          onChange={e => {
                            selection.toggle(entry, e);
                            e.preventDefault();
                          }}
                        />
                      </label>
                      <SecretiveLink
                        className={cn(
                          'f36-padding-top--m f36-padding-bottom--m',
                          styles.textOverflow
                        )}
                        href={getHref()}>
                        {entryTitleFormatter(entry)}
                      </SecretiveLink>
                    </span>
                  </TableCell>
                  {isContentTypeVisible && (
                    <TableCell
                      testId="content-type"
                      className={cn(styles.tableCell, styles.mediumCell)}>
                      <SecretiveLink href={getHref()}>
                        {contentTypeNameFormatter(entry)}
                      </SecretiveLink>
                    </TableCell>
                  )}
                  {displayedFields.map(field => (
                    <TableCell
                      key={field.id}
                      className={cn(styles.tableCell, styles.mediumCell)}
                      testId={field.name}>
                      <SecretiveLink href={getHref()}>
                        <DisplayField
                          field={field}
                          entry={entry}
                          entryCache={entryCache}
                          assetCache={assetCache}
                        />
                      </SecretiveLink>
                    </TableCell>
                  ))}
                  <TableCell testId="status" className={styles.mediumCell}>
                    <SecretiveLink href={getHref()}>
                      {jobs.find(job => job.sys.entity.sys.id === entry.data.sys.id) && (
                        <Icon
                          icon="Clock"
                          size="small"
                          className={cn(styles.marginRightXS)}
                          color="muted"
                        />
                      )}
                      <EntityStatusTag
                        statusLabel={EntityState.stateName(EntityState.getState(entry.data.sys))}
                      />
                    </SecretiveLink>
                  </TableCell>
                </TableRow>
              );
            }}
          </StateLink>
        ))}
      </TableBody>
    </Table>
  );
}

EntryList.propTypes = {
  context: PropTypes.object.isRequired,
  entryTitleFormatter: PropTypes.func.isRequired,
  contentTypeNameFormatter: PropTypes.func.isRequired,
  displayedFields: PropTypes.array.isRequired,
  displayFieldForFilteredContentType: PropTypes.func.isRequired,
  fieldIsSortable: PropTypes.func.isRequired,
  isOrderField: PropTypes.func.isRequired,
  orderColumnBy: PropTypes.func.isRequired,
  hiddenFields: PropTypes.array,
  removeDisplayField: PropTypes.func.isRequired,
  addDisplayField: PropTypes.func.isRequired,
  toggleContentType: PropTypes.func.isRequired,
  updateFieldOrder: PropTypes.func.isRequired,
  selection: PropTypes.object,
  entries: PropTypes.array,
  actions: PropTypes.object,
  entryCache: PropTypes.object,
  assetCache: PropTypes.object,
  jobs: PropTypes.array
};

function isTargetInput(e) {
  return e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL';
}
