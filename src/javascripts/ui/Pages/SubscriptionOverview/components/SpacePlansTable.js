import React from 'react';
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

import SpacePlanRow from '../SpacePlanRow';

const styles = {
  nameCol: css({
    width: '30%',
  }),
  typeCol: css({
    width: '30%',
  }),
  createdByCol: css({
    width: '20%',
  }),
  actionsCol: css({
    width: '60px',
  }),
};

export function SpacePlansTable({
  plans,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
  showSpacePlanChangeBtn,
  initialLoad,
  upgradedSpaceId,
}) {
  return (
    <Table testId="subscription-page.table">
      <colgroup>
        <col className={styles.nameCol} />
        <col className={styles.typeCol} />
        <col className={styles.createdByCol} />
        <col className={styles.createdOnCol} />
        <col className={styles.actionsCol} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Space type</TableCell>
          <TableCell>Created by</TableCell>
          <TableCell>Created on</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {initialLoad ? (
          <SkeletonRow columnCount={5} rowCount={10} />
        ) : (
          plans.map((plan) => {
            const isUpgraded = Boolean(plan.space && plan.space.sys.id === upgradedSpaceId);
            return (
              <SpacePlanRow
                key={plan.sys.id || (plan.space && plan.space.sys.id)}
                plan={plan}
                onChangeSpace={onChangeSpace}
                onDeleteSpace={onDeleteSpace}
                hasUpgraded={isUpgraded}
                enterprisePlan={enterprisePlan}
                showSpacePlanChangeBtn={showSpacePlanChangeBtn}
              />
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

SpacePlansTable.propTypes = {
  plans: PropTypes.array.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  showSpacePlanChangeBtn: PropTypes.bool,
  initialLoad: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
};
