import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Paragraph,
  Heading,
  TextLink,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SkeletonRow,
} from '@contentful/forma-36-react-components';

import { calculatePlansCost } from 'utils/SubscriptionUtils';
import { Pluralized, Price } from 'core/components/formatting';

import SpacePlanRow from './SpacePlanRow';

const styles = {
  total: css({
    marginBottom: '1.5em',
  }),
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

function SpacePlans({
  initialLoad,
  spacePlans,
  upgradedSpaceId,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
}) {
  const numSpaces = spacePlans.length;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return (
    <>
      <Heading className="section-title">Spaces</Heading>

      <Paragraph className={styles.total}>
        {numSpaces > 0 ? (
          <>
            Your organization has{' '}
            <b>
              <Pluralized text="space" count={numSpaces} />
            </b>
            {'. '}
          </>
        ) : (
          "Your organization doesn't have any spaces. "
        )}
        {!enterprisePlan && totalCost > 0 && (
          <>
            The total for your spaces is{' '}
            <b>
              <Price value={totalCost} />
            </b>{' '}
            per month.{' '}
          </>
        )}
        <TextLink onClick={onCreateSpace}>Create Space</TextLink>
      </Paragraph>

      {(initialLoad || numSpaces > 0) && (
        <Table>
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
              spacePlans.map((plan) => {
                const isUpgraded = Boolean(plan.space && plan.space.sys.id === upgradedSpaceId);
                return (
                  <SpacePlanRow
                    key={plan.sys.id || (plan.space && plan.space.sys.id)}
                    plan={plan}
                    onChangeSpace={onChangeSpace}
                    onDeleteSpace={onDeleteSpace}
                    hasUpgraded={isUpgraded}
                    enterprisePlan={enterprisePlan}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </>
  );
}

SpacePlans.propTypes = {
  initialLoad: PropTypes.bool,
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
};

SpacePlans.defaultProps = {
  initialLoad: true,
  enterprisePlan: false,
  upgradedSpaceId: '',
};

export default SpacePlans;
