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

const styles = {
  nameCol: css({
    width: '30%',
  }),
};

export function UnassignedPlansTable({ plans, initialLoad }) {
  return (
    <Table testId="subscription-page.unassigned-plans-table">
      <colgroup>
        <col className={styles.nameCol} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell>Space type</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {initialLoad ? (
          <SkeletonRow columnCount={1} rowCount={10} />
        ) : (
          plans.map((plan) => {
            return (
              <TableRow
                testId="subscription-page.spaces-list.unassigned-plans-table-row"
                key={plan.sys.id || (plan.space && plan.space.sys.id)}>
                <TableCell>
                  <strong>{plan.name}</strong>&nbsp;
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

UnassignedPlansTable.propTypes = {
  plans: PropTypes.array.isRequired,
  initialLoad: PropTypes.bool,
};
