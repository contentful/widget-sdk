import React, { useState, useCallback, useEffect } from 'react';
import { useAsync } from 'core/hooks';
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

import { track } from 'analytics/Analytics';
import Pagination from 'app/common/Pagination';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { getSpacesUsage } from '../services/SpacesUsageService';
import type { SpacePlan } from '../types';
import { SpacePlanRow } from './SpacePlanRow';
import { SortableHeaderCell, ColumnId, SortOrder } from './SortableHeaderCell';

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

async function fetchSpacesUsage(organizationId: string, sortParam: string, pagination) {
  const orgEndpoint = createOrganizationEndpoint(organizationId);

  return await getSpacesUsage(orgEndpoint, {
    order: sortParam,
    skip: pagination.skip,
    limit: pagination.limit,
  });
}
interface SpacePlansTableProps {
  // It tells if thise table is for an Enterprise customer or not
  enterprisePlan?: boolean;
  // It tells the component that SpacePlans is fetching some feature flags
  featureFlagLoading?: boolean;
  // function to be called when user clicks on "upgrade" link, "change" link, or "change plan type" button
  onChangeSpace: () => void;
  // function to be called when user deletes a space
  onDeleteSpace: (plan: SpacePlan) => () => void;
  // Id of the current organization
  organizationId: string;
  // Array of space plans, the table will render one row for each item of this array
  plans: SpacePlan[];
  // It tells the table row to render the "change" link
  // TODO: remove "upgrade" link so we do not need this prop
  showSpacePlanChangeBtn?: boolean;
  // Id of the space that has been upgraded
  upgradedSpaceId?: string;
  // optional v1 migration success indicator
  showV1MigrationCommunication?: boolean;
}

export const SpacePlansTable = ({
  plans,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan = false,
  showSpacePlanChangeBtn = false,
  featureFlagLoading = false,
  upgradedSpaceId,
  organizationId,
  showV1MigrationCommunication,
}: SpacePlansTableProps) => {
  const [pagination, setPagination] = useState({ skip: 0, limit: 10 });
  const [plansLookup, setPlansLookup] = useState({});

  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [sortColumn, setSortColumn] = useState<ColumnId>(ColumnId.SPACE_NAME);

  const handleSort = (columnName: ColumnId) => {
    // Goto page zero on User sort
    setPagination({ ...pagination, skip: 0 });
    track('space_usage_summary:column_sorted', { sortBy: columnName });

    if (columnName === sortColumn) {
      setSortOrder((prevState) => (prevState === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortOrder('ASC');
      setSortColumn(columnName);
    }
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
    track('space_usage_summary:pagination_changed');
  };

  const sortParam = buildSortParam(sortColumn, sortOrder);

  const {
    isLoading: spacesUsageLoading,
    error,
    data,
  } = useAsync(
    useCallback(async () => {
      if (!featureFlagLoading) {
        return fetchSpacesUsage(organizationId, sortParam, pagination);
      }
    }, [organizationId, sortParam, pagination, featureFlagLoading])
  );

  useEffect(() => setPlansLookup(keyBy(plans, (plan) => plan.space?.sys.id)), [plans]);

  return (
    <>
      <Table className={styles.usageTable} testId="subscription-page.table">
        <colgroup>
          <col className={styles.nameCol} />
          <col className={styles.typeCol} />
          <col className={styles.environmentsCol} />
          <col className={styles.rolesCol} />
          <col className={styles.localesCol} />
          <col className={styles.contentTypesCol} />
          <col className={styles.recordsCol} />
          <col className={styles.actionsCol} />
        </colgroup>
        <TableHead>
          <TableRow>
            <SortableHeaderCell
              columnId={ColumnId.SPACE_NAME}
              displayName="Name"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.SPACE_NAME}
            />
            <SortableHeaderCell
              columnId={ColumnId.PLAN_NAME}
              displayName="Space type"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.PLAN_NAME}
            />
            <SortableHeaderCell
              columnId={ColumnId.ENVIRONMENTS}
              displayName="Environments"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.ENVIRONMENTS}
            />
            <SortableHeaderCell
              columnId={ColumnId.ROLES}
              displayName="Roles"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.ROLES}
            />
            <SortableHeaderCell
              columnId={ColumnId.LOCALES}
              displayName="Locales"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.LOCALES}
            />
            <SortableHeaderCell
              columnId={ColumnId.CONTENT_TYPES}
              displayName="Content types"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.CONTENT_TYPES}
            />
            <SortableHeaderCell
              columnId={ColumnId.RECORDS}
              displayName="Records"
              onSort={handleSort}
              sortOrder={sortOrder}
              isActiveSort={sortColumn === ColumnId.RECORDS}
            />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {featureFlagLoading || spacesUsageLoading || !!error ? (
            <SkeletonRow columnCount={12} rowCount={pagination.limit} />
          ) : (
            data?.items.map((spaceUsage) => {
              const spaceId = spaceUsage.sys.space.sys.id;
              const plan = plansLookup[spaceId];
              return plan ? (
                <SpacePlanRow
                  key={spaceUsage.sys.id}
                  organizationId={organizationId}
                  plan={plansLookup[spaceId]}
                  spaceUsage={spaceUsage}
                  onChangeSpace={onChangeSpace}
                  onDeleteSpace={onDeleteSpace}
                  hasUpgraded={spaceId === upgradedSpaceId}
                  enterprisePlan={enterprisePlan}
                  showSpacePlanChangeBtn={showSpacePlanChangeBtn}
                  showV1MigrationCommunication={
                    showV1MigrationCommunication && plan?.legacyVersion === 'V1Migration'
                  }
                />
              ) : null;
            })
          )}
        </TableBody>
      </Table>

      {plans.length >= 10 && (
        <Pagination
          {...pagination}
          total={data?.total ?? 0}
          loading={spacesUsageLoading}
          onChange={handlePaginationChange}
        />
      )}
    </>
  );
};

function buildSortParam(sortColumn: ColumnId, sortOrder: SortOrder) {
  const firstLevelSortDirection = sortOrder === 'DESC' ? '-' : '';
  const secondLevelSortDirection = sortOrder === 'DESC' ? '' : '-';

  return `${firstLevelSortDirection}${sortColumn}${
    sortColumn === ColumnId.SPACE_NAME || sortColumn === ColumnId.PLAN_NAME
      ? ''
      : `.utilization,${secondLevelSortDirection}${sortColumn}.limit`
  }`;
}
