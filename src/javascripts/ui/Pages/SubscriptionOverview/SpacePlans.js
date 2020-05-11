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
} from '@contentful/forma-36-react-components';

import { calculatePlansCost } from 'utils/SubscriptionUtils';

import { Pluralized, Price } from 'core/components/formatting';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';

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
  basePlan,
  spacePlans,
  upgradedSpace,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  isOrgOwner,
}) {
  const numSpaces = spacePlans.length;
  const hasSpacePlans = numSpaces > 0;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return (
    <>
      <Heading className="section-title">Spaces</Heading>
      <Paragraph className={styles.total}>
        {hasSpacePlans ? (
          <>
            Your organization has{' '}
            <b>
              <Pluralized text="space" count={numSpaces} />
            </b>
            {'. '}
          </>
        ) : (
          "Your organization doesn't have any spaces."
        )}
        {!isEnterprisePlan(basePlan) && totalCost > 0 && (
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

      {hasSpacePlans && (
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
            {spacePlans.map((plan) => {
              const isUpgraded = Boolean(plan.space && plan.space.sys.id === upgradedSpace);
              return (
                <SpacePlanRow
                  key={plan.sys.id || (plan.space && plan.space.sys.id)}
                  plan={plan}
                  onChangeSpace={onChangeSpace}
                  onDeleteSpace={onDeleteSpace}
                  isOrgOwner={isOrgOwner}
                  hasUpgraded={isUpgraded}
                  enterprisePlan={isEnterprisePlan(basePlan)}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}

SpacePlans.propTypes = {
  basePlan: PropTypes.object.isRequired,
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired,
  upgradedSpace: PropTypes.string,
};

export default SpacePlans;
