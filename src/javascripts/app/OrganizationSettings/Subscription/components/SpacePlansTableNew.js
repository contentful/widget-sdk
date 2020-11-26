import React, { useState, useCallback, useEffect } from 'react';
import { useAsync } from 'core/hooks';
import PropTypes from 'prop-types';
import { css } from 'emotion';
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
import { keyBy } from 'lodash';
import { SortableHeaderCell } from './SortableHeaderCell';

const styles = {
  nameCol: css({
    width: '30%',
  }),
  typeCol: css({
    width: '20%',
  }),
  usageCol: css({
    width: 'auto',
  }),
  actionsCol: css({
    width: '60px',
  }),
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
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 10,
  });
  const [plansLookup, setPlansLookup] = useState();

  const [sortState, setSortState] = useState({ spaceName: 'ASC' });

  const onSort = (columnName) => {
    const newSortState =
      sortState[columnName] === undefined || sortState[columnName] === 'ASC' ? 'DESC' : 'ASC';
    setSortState({ [columnName]: newSortState });
  };

  const fetchSpacesUsage = useCallback(() => {
    const orgEndpoint = createOrganizationEndpoint(organizationId);
    const query = {
      skip: pagination.skip,
      limit: pagination.limit,
    };
    return getSpacesUsage(orgEndpoint, query);
  }, [organizationId, pagination.skip, pagination.limit]);

  const { isLoading, error, data = {} } = useAsync(fetchSpacesUsage);

  useEffect(() => setPlansLookup(keyBy(plans, (plan) => plan.space?.sys.id)), [plans]);

  return (
    <div>
      <Table>
        <colgroup>
          <col className={styles.nameCol} />
          <col className={styles.typeCol} />
          <col className={styles.usageCol} />
          <col className={styles.usageCol} />
          <col className={styles.usageCol} />
          <col className={styles.usageCol} />
          <col className={styles.usageCol} />
          <col className={styles.actionsCol} />
        </colgroup>
        <TableHead>
          <TableRow>
            <SortableHeaderCell
              id="spaceName"
              displayName="Name"
              onSort={onSort}
              sortOrder={sortState}
            />
            <TableCell>Space type</TableCell>
            <SortableHeaderCell
              id="environments"
              displayName="Environments"
              onSort={onSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="roles"
              displayName="Roles"
              onSort={onSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="locales"
              displayName="Locales"
              onSort={onSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="contentTypes"
              displayName="Content types"
              onSort={onSort}
              sortOrder={sortState}
            />
            <SortableHeaderCell
              id="records"
              displayName="Records"
              onSort={onSort}
              sortOrder={sortState}
            />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {initialLoad || isLoading || !!error ? (
            <SkeletonRow columnCount={8} rowCount={pagination.limit} />
          ) : (
            // The default order of `data.items` is ascending alphabetical order by space name
            // We assume `data.items` do not contain `paceUsage of an deleted space
            data.items.map((spaceUsage) => {
              const spaceId = spaceUsage.sys.space.sys.id;
              const plan = plansLookup[spaceId];
              if (plan) {
                return (
                  <SpacePlanRowNew
                    key={spaceUsage.sys.id}
                    plan={plan}
                    spaceUsage={spaceUsage}
                    onChangeSpace={onChangeSpace}
                    onDeleteSpace={onDeleteSpace}
                    hasUpgraded={spaceId === upgradedSpaceId}
                    enterprisePlan={enterprisePlan}
                    showSpacePlanChangeBtn={showSpacePlanChangeBtn}
                  />
                );
              }
            })
          )}
        </TableBody>
      </Table>
      {data.total && (
        <Pagination
          {...pagination}
          total={data.total}
          loading={isLoading}
          onChange={setPagination}
        />
      )}
    </div>
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
