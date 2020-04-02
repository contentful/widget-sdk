import React from 'react';
import PropTypes from 'prop-types';

import cn from 'classnames';
import { range } from 'lodash';

import {
  Icon,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';

import tokens from '@contentful/forma-36-tokens';

import isHotkey from 'is-hotkey';
import StateLink from 'app/common/StateLink';

import ViewCustomizer from './ViewCustomizer';
import DisplayField from './DisplayField';
import SecretiveLink from 'components/shared/SecretiveLink';

import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import ScheduleTooltip from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduleTooltip';

import { isEdge } from 'utils/browser';
const isEdgeBrowser = isEdge();

import { css } from 'emotion';

import * as EntityState from 'data/CMA/EntityState';
import BulkActionsRowAdapter from '../BulkActionsRowAdapter';
import { onEntryEvent } from './eventTracker';

const styles = {
  flexCenter: css({
    display: 'flex',
    alignItems: 'center',
  }),
  justifySpaceBetween: css({
    justifyContent: 'space-between',
  }),
  table: css({
    tableLayout: 'fixed',
  }),
  tableCell: css({}),
  marginRightXS: css({
    marginRight: tokens.spacingXs,
  }),
  marginRightS: css({
    marginRight: tokens.spacingS,
  }),
  marginLeftXS: css({
    marginLeft: tokens.spacingXs,
  }),
  marginLeftXXS: css({
    marginLeft: tokens.spacing2Xs,
  }),
  marginBottomXXS: css({
    marginBottom: '0.25rem',
  }),
  paddingLeftS: css({
    paddingLeft: tokens.spacingS,
  }),
  paddingTopM: css({
    paddingTop: tokens.spacingM,
  }),
  paddingBottomM: css({
    paddingBottom: tokens.spacingM,
  }),
  fullWidth: css({
    width: '100%',
  }),
  sortable: css({
    '&:focus': {
      zIndex: 1,
    },
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: tokens.colorElementLight,
    },
  }),
  highlight: css({
    backgroundColor: tokens.colorIceMid,
  }),
  activeSort: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  tableHead: css({
    zIndex: tokens.zIndexWorkbenchHeader,
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
  /*
    We want to make area around checkbox clickable
  */
  nameCell: css({
    paddingTop: 0,
    paddingBottom: 0,
  }),
  /*
    TODO: consolidate with #grid tokens
  */
  mediumCell: css({
    width: '15%',
  }),
  largeCell: css({
    width: '21%',
  }),
  /*
    We use visibility:hidden to preserve column width during search, sorting, or pagination.
  */
  visibilityHidden: css({
    visibility: 'hidden',
  }),
  statusTableHeader: css({
    zIndex: tokens.zIndexDefault,
  }),
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
        [styles.activeSort]: isActiveSort,
      })}
      onKeyDown={(e) => {
        if (isTargetInput(e) || e.target.tagName === 'LABEL') {
          return;
        }
        if (isHotkey(['enter', 'space'], e)) {
          onClick(e);
          e.preventDefault();
        }
      }}
      onClick={(e) => {
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
            className={styles.marginLeftXS}
            buttonType="muted"
            iconProps={{
              icon: direction === 'ascending' ? 'ArrowDown' : 'ArrowUp',
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
  onClick: PropTypes.func.isRequired,
};

const StatusCell = ({ href, jobs, entry }) => {
  const filter = (job) => job.entity.sys.id === entry.data.sys.id;
  const hasJobForEntry = jobs.find((job) => job.entity.sys.id === entry.data.sys.id);
  return (
    <SecretiveLink href={href}>
      <ScheduleTooltip jobs={jobs} filter={filter}>
        <Icon icon="Clock" size="small" color="muted" testId="schedule-icon" />
      </ScheduleTooltip>
      <EntityStatusTag
        className={hasJobForEntry ? styles.marginLeftXXS : null}
        statusLabel={EntityState.stateName(EntityState.getState(entry.data.sys))}
      />
    </SecretiveLink>
  );
};

StatusCell.propTypes = {
  href: PropTypes.string.isRequired,
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      action: PropTypes.string.isRequired,
      scheduledAt: PropTypes.string.isRequired,
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
    })
  ),
  entry: PropTypes.shape({
    data: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

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
  entryCache,
  assetCache,
  updateEntries,
  jobs = [],
}) {
  const hasContentTypeSelected = !!context.view.contentTypeId;

  // can be undefined
  const displayFieldName = displayFieldForFilteredContentType();

  const isContentTypeVisible = !hasContentTypeSelected && !context.view.contentTypeHidden;

  const allSelected = entries.length === selection.size();
  const selectAll = (
    <Checkbox
      id="select-all"
      name="select-all"
      className={cn(styles.marginRightS, styles.marginBottomXXS)}
      checked={allSelected}
      onChange={(e) => {
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
      <TableHead offsetTop={isEdgeBrowser ? '0px' : '-20px'} isSticky className={styles.tableHead}>
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
            <label htmlFor="select-all" className={styles.paddingLeftS}>
              {selectAll}
              Name
            </label>
          </SortableTableCell>
          {!hasContentTypeSelected && isContentTypeVisible && (
            <TableCell testId="content-type" className={styles.mediumCell}>
              Content Type
            </TableCell>
          )}

          {displayedFields.map((field) => {
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
          <TableCell testId="status" className={cn(styles.mediumCell, styles.statusTableHeader)}>
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
        <BulkActionsRowAdapter
          allowDuplicate
          colSpan={columnLength}
          entityType="Entry"
          selection={selection}
          updateEntities={updateEntries}
          onActionComplete={onEntryEvent}
        />
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
        {entries.map((entry) => (
          <StateLink path="^.detail" params={{ entryId: entry.getId() }} key={entry.getId()}>
            {({ onClick, getHref }) => {
              return (
                <TableRow
                  tabIndex="0"
                  onClick={(e) => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    onClick(e);
                  }}
                  onKeyDown={(e) => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    if (isHotkey(['enter', 'space'], e)) {
                      onClick(e);
                      e.preventDefault();
                    }
                  }}
                  className={cn(styles.cursorPointer, {
                    [styles.highlight]: selection.isSelected(entry),
                    [styles.visibilityHidden]: context.isSearching,
                  })}
                  testId="entry-row">
                  <TableCell
                    testId="name"
                    className={cn(styles.tableCell, styles.nameCell, styles.largeCell)}>
                    <span className={styles.flexCenter}>
                      <label
                        className={cn(
                          styles.paddingLeftS,
                          styles.paddingTopM,
                          styles.paddingBottomM
                        )}>
                        <Checkbox
                          className={cn(styles.marginRightS, styles.marginBottomXXS)}
                          checked={selection.isSelected(entry)}
                          onChange={(e) => {
                            selection.toggle(entry, e);
                            e.preventDefault();
                          }}
                        />
                      </label>
                      <SecretiveLink
                        className={cn(
                          styles.paddingTopM,
                          styles.paddingBottomM,
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
                  {displayedFields.map((field) => (
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
                    <StatusCell href={getHref()} jobs={jobs} entry={entry} />
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
  updateEntries: PropTypes.func.isRequired,
  entryCache: PropTypes.object,
  assetCache: PropTypes.object,
  jobs: PropTypes.array,
};

function isTargetInput(e) {
  return e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL';
}
