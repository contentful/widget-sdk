import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { range, noop } from 'lodash';
import { css } from 'emotion';
import {
  CheckboxField,
  Icon,
  IconButton,
  SkeletonBodyText,
  SkeletonContainer,
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
import * as EntityState from 'data/CMA/EntityState';
import StateLink from 'app/common/StateLink';
import BulkActionsRowAdapter from './BulkActionsRowAdapter';
import useSelectedEntities from './useSelectedEntities';

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
  }),
  checkboxCell: css({
    width: tokens.spacingXl,
    zIndex: tokens.zIndexDefault,
    verticalAlign: 'middle',
    '& > div': {
      marginRight: tokens.spacingS,
    },
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
        statusLabel={EntityState.stateName(EntityState.getState(entity.data.sys))}
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
  className: PropTypes.string,
  children: PropTypes.node,
};

const isTargetInput = ({ target }) => target.tagName === 'INPUT' || target.tagName === 'LABEL';

const onKeyDownEvent = (onClick, preventDefault = true) => (e) => {
  if (isTargetInput(e)) return;
  if (isHotkey(['enter', 'space'], e)) {
    onClick(e);
    preventDefault && e.preventDefault();
  }
};

const onClickEvent = (onClick, preventDefault = true) => (e) => {
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

const EntityList = ({
  className,
  displayedFields,
  entities,
  jobs,
  isLoading,
  entityType,
  updateEntities,
  onBulkActionComplete,
  statusColSpan,
  renderViewCustomizer,
  renderDisplayField,
}) => {
  const [
    { allSelected, selected },
    { isSelected, clearSelected, toggleSelected, toggleAllSelected },
  ] = useSelectedEntities({ entities });
  // all displayed fields + status column + checkBoxColumn
  const columnLength = displayedFields.reduce(
    (acc, { colSpan = 1 }) => acc + colSpan,
    statusColSpan + 1
  );
  return (
    <Table
      className={cn(className, styles.table)}
      testId={`${entityType}-list`}
      aria-label="Content Search Results"
      cellPadding={`${tokens.spacingM} ${tokens.spacingS}`}>
      <TableHead offsetTop={isEdge() ? '0px' : '-20px'} isSticky className={styles.tableHead}>
        <TableRow testId="column-names">
          <CheckboxCell
            visible
            name="select-all"
            checked={allSelected}
            onClick={toggleAllSelected}
          />
          {displayedFields.map(
            ({
              id,
              colSpan = 1,
              className,
              name,
              onClick,
              isActiveSort,
              isSortable,
              direction,
            }) => {
              return (
                <SortableTableCell
                  key={id}
                  testId={id}
                  colSpan={colSpan}
                  isSortable={isSortable}
                  isActiveSort={isActiveSort}
                  onClick={onClick}
                  direction={direction}
                  aria-label={name}
                  className={cn(className)}>
                  <span className={styles.fieldWrapper} title={name}>
                    {name}
                  </span>
                </SortableTableCell>
              );
            }
          )}
          <TableCell testId="status" colSpan={statusColSpan} className={styles.statusTableHeader}>
            <span className={cn(styles.flexCenter, styles.justifySpaceBetween)}>
              Status
              {renderViewCustomizer()}
            </span>
          </TableCell>
        </TableRow>
        <BulkActionsRowAdapter
          colSpan={columnLength}
          entityType={entityType}
          selectedEntities={selected}
          clearSelected={clearSelected}
          updateEntities={updateEntities}
          onActionComplete={onBulkActionComplete}
        />
      </TableHead>
      <TableBody>
        {(isLoading || entities.length === 0) &&
          range(0, entities.length || 10).map((_, i) => {
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
        {entities.map((entity) => {
          const entityId = entity.getId();
          const type = entity.getType().toLowerCase();
          const entityIsSelected = isSelected(entity);
          return (
            <StateLink path="^.detail" params={{ [`${type}Id`]: entityId }} key={entityId}>
              {({ onClick, getHref }) => {
                const href = getHref();
                return (
                  <TableRow
                    tabIndex="0"
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
                      const { id, className, colSpan = 1 } = field;
                      const uniqueId = `${entityId}_${id}`;
                      return (
                        <TableCell
                          key={uniqueId}
                          className={className}
                          testId={id}
                          onClick={onClick}
                          colSpan={colSpan}>
                          <SecretiveLink
                            href={href}
                            className={cn(styles.flexCenter, styles.fieldWrapper)}>
                            {renderDisplayField({ field, entity })}
                          </SecretiveLink>
                        </TableCell>
                      );
                    })}
                    <TableCell testId="status" colSpan={statusColSpan}>
                      <StatusCell href={href} jobs={jobs} entity={entity} />
                    </TableCell>
                  </TableRow>
                );
              }}
            </StateLink>
          );
        })}
      </TableBody>
    </Table>
  );
};

EntityList.propTypes = {
  className: PropTypes.string,
  displayedFields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      colSpan: PropTypes.number,
      onClick: PropTypes.func,
      isSortable: PropTypes.bool,
      isActiveSort: PropTypes.bool,
      direction: PropTypes.string,
    })
  ).isRequired,
  entities: PropTypes.arrayOf(PropTypes.object).isRequired,
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  updateEntities: PropTypes.func.isRequired,
  onBulkActionComplete: PropTypes.func,
  statusColSpan: PropTypes.number,
  renderViewCustomizer: PropTypes.func,
  renderDisplayField: PropTypes.func.isRequired,
};

EntityList.defaultProps = {
  displayedFields: [],
  entities: [],
  jobs: [],
  statusColSpan: 1,
  onBulkActionComplete: noop,
  renderViewCustomizer: noop,
};

export default EntityList;
