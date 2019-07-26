/* eslint "rulesdir/restrict-inline-styles": "warn" */
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
  TableBody
} from '@contentful/forma-36-react-components';

import { calculatePlansCost } from 'utils/SubscriptionUtils.es6';

import Pluralized from 'ui/Components/Pluralized.es6';
import Price from 'ui/Components/Price.es6';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider.es6';

import SpacePlanRow from './SpacePlanRow.es6';

const styles = {
  total: css({
    marginBottom: '1.5em'
  })
};

function SpacePlans({
  basePlan,
  spacePlans,
  upgradedSpace,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  isOrgOwner
}) {
  const numSpaces = spacePlans.length;
  const hasSpacePlans = numSpaces > 0;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return (
    <>
      <Heading className="section-title">Spaces</Heading>
      <Paragraph className={styles.total}>
        {!hasSpacePlans && "Your organization doesn't have any spaces. "}
        {hasSpacePlans && (
          <>
            Your organization has{' '}
            <b>
              <Pluralized text="space" count={numSpaces} />
            </b>
            {'. '}
          </>
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
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '33%' }}>Name</TableCell>
              <TableCell style={{ width: '20%' }}>
                {isEnterprisePlan(basePlan) ? 'Space type' : 'Space type / price'}
              </TableCell>
              <TableCell style={{ width: '25%' }}>Created by</TableCell>
              <TableCell style={{ width: '15%' }}>Created on</TableCell>
              <TableCell> </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {spacePlans.map(plan => {
              const isUpgraded = Boolean(plan.space && plan.space.sys.id === upgradedSpace);
              return (
                <SpacePlanRow
                  key={plan.sys.id || (plan.space && plan.space.sys.id)}
                  upgraded={isUpgraded}
                  basePlan={basePlan}
                  plan={plan}
                  onChangeSpace={onChangeSpace}
                  onDeleteSpace={onDeleteSpace}
                  isOrgOwner={isOrgOwner}
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
  upgradedSpace: PropTypes.string
};

export default SpacePlans;
