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
import { SpacePlanRowNew } from '../SpacePlanRowNew';
import Pagination from 'app/common/Pagination';
import { getSpacesUsage } from '../SpacesUsageService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { SortableHeaderCell } from './SortableHeaderCell';

const styles = {
  usageTable: css({
    tableLayout: 'fixed',
  }),
  nameCol: css({
    width: '28%',
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
    width: '13%',
  }),
  recordsCol: css({
    width: '10%',
  }),
  actionsCol: css({
    width: '50px',
  }),
};

// FIXME rename space_name to spaceName once the endpoint is fixed
const SORT_BY_NAME_COL = 'space_name';

const buildSortParam = (sortState) => {
  const [columnNameAndOrder = []] = Object.entries(sortState);
  const [name, sortOrder] = columnNameAndOrder;
  return `${sortOrder === 'DESC' ? '-' : ''}${name}${
    name === SORT_BY_NAME_COL ? '' : '.utilization'
  }`;
};

export const SpacePlansTableNew = ({
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
  const [sortState, setSortState] = useState({ [SORT_BY_NAME_COL]: 'ASC' });

  const handleSort = (columnName) => {
    setSortState({ [columnName]: sortState[columnName] === 'ASC' ? 'DESC' : 'ASC' });
    // Go to page zero on User sort request
    setPagination({ ...pagination, skip: 0 });
  };

  const fetchSpacesUsage = useCallback(() => {
    const orgEndpoint = createOrganizationEndpoint(organizationId);
    const query = {
      order: buildSortParam(sortState),
      skip: pagination.skip,
      limit: pagination.limit,
    };
    return getSpacesUsage(orgEndpoint, query);
  }, [organizationId, pagination.skip, pagination.limit, sortState]);

  const { isLoading, error, data = { total: 0 } } = useAsync(fetchSpacesUsage);

  useEffect(() => setPlansLookup(keyBy(plans, (plan) => plan.space?.sys.id)), [plans]);

  return (
    <>
      <Table className={styles.usageTable}>
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
              id="space_name"
              displayName="Name"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <TableCell>Space type</TableCell>
            <SortableHeaderCell
              id="environments"
              displayName="Environments"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="roles"
              displayName="Roles"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="locales"
              displayName="Locales"
              onSort={handleSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="contentTypes"
              displayName="Content types"
              onSort={handleSort}
              sortOrder={sortState}
            />
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
            <SkeletonRow columnCount={8} rowCount={pagination.limit} />
          ) : (
            data.items.map((spaceUsage) => {
              const spaceId = spaceUsage.sys.space.sys.id;
              const plan = plansLookup[spaceId];
              return plan ? (
                <SpacePlanRowNew
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
      <Pagination {...pagination} total={data.total} loading={isLoading} onChange={setPagination} />
    </>
  );
};

SpacePlansTableNew.propTypes = {
  plans: PropTypes.array.isRequired,
  organizationId: PropTypes.string,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  showSpacePlanChangeBtn: PropTypes.bool,
  initialLoad: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
};
