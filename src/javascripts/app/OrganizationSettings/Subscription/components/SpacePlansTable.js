import React, { useState, useCallback, useEffect } from 'react';
import { useAsync } from 'core/hooks';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { keyBy } from 'lodash';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SkeletonRow,
} from '@contentful/forma-36-react-components';
import { SpacePlanRow } from '../SpacePlanRow';
import Pagination from 'app/common/Pagination';
import { getSpacesUsage } from '../SpacesUsageService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { SortableHeaderCell } from './SortableHeaderCell';
import { track } from 'analytics/Analytics';

const styles = {
  usageTable: css({
    tableLayout: 'fixed',
  }),
  nameCol: css({
    width: '26%',
  }),
  typeCol: css({
    width: '20%',
  }),
  environmentsCol: css({
    width: '12%',
  }),
  rolesCol: css({
    width: '8%',
  }),
  localesCol: css({
    width: '9%',
  }),
  contentTypesCol: css({
    width: '14%',
  }),
  recordsCol: css({
    width: '12%',
  }),
  actionsCol: css({
    width: '50px',
  }),
  iconCol: css({
    width: '5px',
  }),
};

const buildSortParam = (sortState) => {
  const [columnNameAndOrder = []] = Object.entries(sortState);
  const [name, sortOrder] = columnNameAndOrder;
  const firstLevelSortDirection = sortOrder === 'DESC' ? '-' : '';
  const secondLevelSortDirection = sortOrder === 'DESC' ? '' : '-';
  return `${firstLevelSortDirection}${name}${
    name === 'spaceName' || name === 'planName'
      ? ''
      : `.utilization,${secondLevelSortDirection}${name}.limit`
  }`;
};

export const SpacePlansTable = ({
  plans,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
  showSpacePlanChangeBtn,
  initialLoad,
  upgradedSpaceId,
  organizationId,
}) => {
  const [pagination, setPagination] = useState({ skip: 0, limit: 10 });
  const [plansLookup, setPlansLookup] = useState({});
  const [sortState, setSortState] = useState({ spaceName: 'ASC' });

  const handleSort = (columnName) => {
    setSortState({ [columnName]: sortState[columnName] === 'DESC' ? 'ASC' : 'DESC' });
    // Goto page zero on User sort
    setPagination({ ...pagination, skip: 0 });
    track('space_usage_summary:column_sorted', { sortBy: columnName });
  };

  const handlePaginationChange = (pagination) => {
    setPagination(pagination);
    track('space_usage_summary:pagination_changed');
  };

  const fetchSpacesUsage = useCallback(() => {
    const orgEndpoint = createOrganizationEndpoint(organizationId);
    return getSpacesUsage(orgEndpoint, {
      order: buildSortParam(sortState),
      skip: pagination.skip,
      limit: pagination.limit,
    });
  }, [organizationId, pagination.skip, pagination.limit, sortState]);

  const { isLoading, error, data = { total: 0 } } = useAsync(fetchSpacesUsage);

  useEffect(() => setPlansLookup(keyBy(plans, (plan) => plan.space?.sys.id)), [plans]);

  return (
    <>
      <Table className={styles.usageTable} testId="subscription-page.table">
        <colgroup>
          <col className={styles.nameCol} />
          <col className={styles.typeCol} />
          <col className={styles.iconCol} />
          <col className={styles.environmentsCol} />
          <col className={styles.iconCol} />
          <col className={styles.rolesCol} />
          <col className={styles.iconCol} />
          <col className={styles.localesCol} />
          <col className={styles.iconCol} />
          <col className={styles.contentTypesCol} />
          <col className={styles.iconCol} />
          <col className={styles.recordsCol} />
          <col className={styles.actionsCol} />
        </colgroup>
        <TableHead>
          <TableRow>
            <SortableHeaderCell
              id="spaceName"
              displayName="Name"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="planName"
              displayName="Space type"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
            <SortableHeaderCell
              id="environments"
              displayName="Environments"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
            <SortableHeaderCell
              id="roles"
              displayName="Roles"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
            <SortableHeaderCell
              id="locales"
              displayName="Locales"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
            <SortableHeaderCell
              id="contentTypes"
              displayName="Content types"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
            <SortableHeaderCell
              id="records"
              displayName="Records"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {initialLoad || isLoading || !!error ? (
            <SkeletonRow columnCount={12} rowCount={pagination.limit} />
          ) : (
            data.items.map((spaceUsage) => {
              const spaceId = spaceUsage.sys.space.sys.id;
              const plan = plansLookup[spaceId];
              return plan ? (
                <SpacePlanRow
                  key={spaceUsage.sys.id}
                  plan={plansLookup[spaceId]}
                  spaceUsage={spaceUsage}
                  onChangeSpace={onChangeSpace}
                  onDeleteSpace={onDeleteSpace}
                  hasUpgraded={spaceId === upgradedSpaceId}
                  enterprisePlan={enterprisePlan}
                  showSpacePlanChangeBtn={showSpacePlanChangeBtn}
                />
              ) : null;
            })
          )}
        </TableBody>
      </Table>
      <Pagination
        {...pagination}
        total={data.total}
        loading={isLoading}
        onChange={handlePaginationChange}
      />
    </>
  );
};

SpacePlansTable.propTypes = {
  plans: PropTypes.array.isRequired,
  organizationId: PropTypes.string,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  showSpacePlanChangeBtn: PropTypes.bool,
  initialLoad: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
};
