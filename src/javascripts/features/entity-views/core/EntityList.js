import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { noop } from 'lodash';
import { css, cx } from 'emotion';
import {
  Checkbox,
  CheckboxField,
  Icon,
  IconButton,
  SkeletonRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import isHotkey from 'is-hotkey';
import { isEdge } from 'utils/browser';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import SecretiveLink from 'components/shared/SecretiveLink';
import ScheduleTooltip from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduleTooltip';
import { getState } from 'data/CMA/EntityState';
import StateLink from 'app/common/StateLink';
import { useSelectedEntities } from 'core/hooks';
import { BulkActionsRow } from './BulkActions/BulkActionsRow';
import { MetadataTags, useTagsFeatureEnabled } from 'features/content-tags';

const noWrapEllipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const styles = {
  flexCenter: css({
    display: 'flex !important',
    alignItems: 'center',
  }),
  table: css({
    tableLayout: 'fixed',
  }),
  justifySpaceBetween: css({
    justifyContent: 'space-between',
  }),
  marginLeftXS: css({
    marginLeft: tokens.spacingXs,
  }),
  marginLeftXXS: css({
    marginLeft: tokens.spacing2Xs,
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
  inline: css({
    display: 'inline !important',
  }),
  fieldWrapper: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& > span': {
      alignItems: 'center',
    },
  }),
  noWrap: css({
    ...noWrapEllipsis,
    '& > span': noWrapEllipsis,
    '& > a': noWrapEllipsis,
  }),
  tableHead: css({
    zIndex: tokens.zIndexWorkbenchHeader,
  }),
  // This z-index is needed to hit the sweet spot between hiding the app icon below the header and the header not overlapping the dropdown menu
  tableHeadCell: css({
    verticalAlign: 'middle',
    zIndex: 2,
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
  /*
    We use visibility:hidden to preserve column width during search, sorting, or pagination.
  */
  visibilityHidden: css({
    visibility: 'hidden',
  }),
  statusTableHeader: css({
    zIndex: tokens.zIndexDefault,
    width: '17%',
  }),
  checkboxCell: css({
    paddingRight: 0,
    zIndex: tokens.zIndexDefault,
    width: '40px',
  }),
  statusColumn: css({
    width: '17%',
  }),
};

const StatusCell = ({ href, jobs, entity }) => {
  const filter = (job) => job.entity.sys.id === entity.data.sys.id;
  const hasJobForEntity = jobs.find((job) => job.entity.sys.id === entity.data.sys.id);
  return (
    <SecretiveLink href={href}>
      <ScheduleTooltip jobs={jobs} filter={filter}>
        <Icon icon="Clock" size="small" color="muted" testId="schedule-icon" />
      </ScheduleTooltip>
      <EntityStatusTag
        className={hasJobForEntity ? styles.marginLeftXXS : null}
        statusLabel={getState(entity.data.sys)}
      />
    </SecretiveLink>
  );
};

StatusCell.propTypes = {
  href: PropTypes.string.isRequired,
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      action: PropTypes.string.isRequired,
      scheduledFor: PropTypes.shape({
        datetime: PropTypes.string.isRequired,
        timezone: PropTypes.string,
      }),
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
    })
  ),
  entity: PropTypes.shape({
    data: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const CheckboxCell = ({ name, checked, onClick }) => {
  return (
    <TableCell className={styles.checkboxCell} onClick={onClick}>
      <CheckboxField labelText="" id={name} testId={name} name={name} checked={checked} />
    </TableCell>
  );
};

CheckboxCell.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const isTargetInput = ({ target }) => target.tagName === 'INPUT' || target.tagName === 'LABEL';

const onKeyDownEvent =
  (onClick, preventDefault = true) =>
  (e) => {
    if (isTargetInput(e)) return;
    if (isHotkey(['enter', 'space'], e)) {
      onClick(e);
      preventDefault && e.preventDefault();
    }
};

const onClickEvent =
  (onClick, preventDefault = true) =>
  (e) => {
    onClick(e);
    preventDefault && e.preventDefault();
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
      onKeyDown={onKeyDownEvent(onClick)}
      onClick={onClickEvent(onClick)}
      {...rest}>
      <span className={styles.flexCenter}>
        {children}
        {isSortable && isActiveSort && (
          <IconButton
            tabIndex="-1"
            label="change-sort-order"
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

SortableTableCell.defaultProps = {
  onClick: noop,
};

export const EntityList = ({
  className,
  displayedFields,
  entities,
  jobs,
  isLoading,
  entityType,
  updateEntities,
  onBulkActionComplete,
  renderViewCustomizer,
  renderDisplayField,
  pageIndex,
}) => {
  const [
    { allSelected, selected },
    { isSelected, clearSelected, toggleSelected, toggleAllSelected },
  ] = useSelectedEntities({ entities });

  // columnCount is the number of displayed fields + 2 (checkbox column and status column will always be there)
  const columnCount = displayedFields.length + 2;

  const { tagsEnabled } = useTagsFeatureEnabled();

  const renderContent = () => {
    return (
      <Table
        className={cn(className, styles.table)}
        testId={`${entityType}-list`}
        aria-label="Content Search Results"
        cellPadding={`${tokens.spacingM} ${tokens.spacingS}`}>
        <TableHead offsetTop={isEdge() ? '0px' : '-24px'} isSticky className={styles.tableHead}>
          <TableRow testId="column-names">
            <TableCell className={styles.checkboxCell} onClick={toggleAllSelected}>
              <Checkbox
                id="select-all"
                testId="select-all"
                name="select-all"
                checked={allSelected}
                className={css({ marginTop: '2px' })}
              />
            </TableCell>
            {displayedFields.map(
              ({
                id,
                className,
                name,
                onClick,
                isActiveSort,
                isSortable,
                direction,
                colWidth: width = 'auto',
              }) => {
                return (
                  <SortableTableCell
                    key={id}
                    testId={id}
                    isSortable={isSortable}
                    isActiveSort={isActiveSort}
                    onClick={onClick}
                    direction={direction}
                    aria-label={name}
                    className={cx(className, styles.tableHeadCell, css({ width }))}>
                    <span className={styles.fieldWrapper} title={name}>
                      {name}
                    </span>
                  </SortableTableCell>
                );
              }
            )}
            <TableCell testId="status" className={styles.statusTableHeader}>
              <span className={cn(styles.flexCenter, styles.justifySpaceBetween)}>
                Status
                {renderViewCustomizer()}
              </span>
            </TableCell>
          </TableRow>
          <BulkActionsRow
            colSpan={columnCount}
            entityType={entityType}
            selectedEntities={selected}
            updateEntities={updateEntities}
            onActionComplete={(...args) => {
              clearSelected();
              onBulkActionComplete(...args);
            }}
          />
        </TableHead>
        <TableBody>
          {isLoading ? (
            <SkeletonRow rowCount={entities.length || 10} columnCount={columnCount} />
          ) : (
            entities.map((entity, index) => {
              const entityId = entity.getId();
              const type = entity.getType().toLowerCase();
              const entityIsSelected = isSelected(entity);
              return (
                <StateLink
                  path="^.detail"
                  params={{ [`${type}Id`]: entityId }}
                  trackingEvent={entityType === 'entry' ? 'search:entry_clicked' : null}
                  trackParams={{ entry_index: index, page_index: pageIndex }}
                  key={entityId}>
                  {({ onClick, getHref }) => {
                    const href = getHref();
                    return (
                      <TableRow
                        tabIndex="0"
                        selected={entityIsSelected}
                        onKeyDown={onKeyDownEvent(onClick, false)}
                        className={cn(styles.cursorPointer, {
                          [styles.highlight]: entityIsSelected,
                          [styles.visibilityHidden]: isLoading,
                        })}
                        testId={`${entityType}-row`}>
                        <CheckboxCell
                          name={`select-${entityId}`}
                          checked={entityIsSelected}
                          onClick={() => toggleSelected(entity)}
                        />
                        {displayedFields.map((field) => {
                          const { id, className, colWidth: width = 'auto' } = field;
                          const uniqueId = `${entityId}_${id}`;
                          return (
                            <TableCell
                              key={uniqueId}
                              className={cx(className, css({ width }))}
                              testId={id}
                              onClick={onClick}>
                              <SecretiveLink
                                href={href}
                                className={cn(styles.flexCenter, styles.fieldWrapper)}>
                                {renderDisplayField({ field, entity, tagsEnabled })}
                              </SecretiveLink>
                            </TableCell>
                          );
                        })}
                        <TableCell testId="status" className={styles.statusColumn}>
                          <StatusCell href={href} jobs={jobs} entity={entity} />
                        </TableCell>
                      </TableRow>
                    );
                  }}
                </StateLink>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  };

  return <MetadataTags>{renderContent()}</MetadataTags>;
};

EntityList.propTypes = {
  className: PropTypes.string,
  displayedFields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      onClick: PropTypes.func,
      isSortable: PropTypes.bool,
      isActiveSort: PropTypes.bool,
      direction: PropTypes.string,
      colWidth: PropTypes.string,
    })
  ).isRequired,
  entities: PropTypes.arrayOf(PropTypes.object).isRequired,
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  updateEntities: PropTypes.func.isRequired,
  onBulkActionComplete: PropTypes.func,
  renderViewCustomizer: PropTypes.func,
  renderDisplayField: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
};

EntityList.defaultProps = {
  displayedFields: [],
  entities: [],
  jobs: [],
  onBulkActionComplete: noop,
  renderViewCustomizer: noop,
  pageIndex: 0,
};
