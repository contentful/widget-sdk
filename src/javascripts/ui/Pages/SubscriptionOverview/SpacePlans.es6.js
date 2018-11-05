import React from 'react';
import PropTypes from 'prop-types';

import { calculatePlansCost } from 'utils/SubscriptionUtils.es6';

import Pluralized from 'ui/Components/Pluralized.es6';
import Price from 'ui/Components/Price.es6';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider.es6';

import SpacePlanRow from './SpacePlanRow.es6';

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
    <div>
      <h2 className="section-title">Spaces</h2>
      <p style={{ marginBottom: '1.5em' }}>
        {!hasSpacePlans && "Your organization doesn't have any spaces. "}
        {hasSpacePlans && (
          <span>
            Your organization has{' '}
            <b>
              <Pluralized text="space" count={numSpaces} />
            </b>
            {'. '}
          </span>
        )}
        {!isEnterprisePlan(basePlan) &&
          totalCost > 0 && (
            <span>
              The total for your spaces is{' '}
              <b>
                <Price value={totalCost} />
              </b>{' '}
              per month.{' '}
            </span>
          )}
        <a className="text-link" onClick={onCreateSpace}>
          Add Space
        </a>
      </p>

      {hasSpacePlans && (
        <div className="table spaces-table">
          <table>
            <thead className="table__head">
              <tr>
                <th style={{ width: '33%' }}>Name</th>
                <th style={{ width: '20%' }}>
                  {isEnterprisePlan(basePlan) ? 'Space type' : 'Space type / price'}
                </th>
                <th style={{ width: '25%' }}>Created by</th>
                <th style={{ width: '15%' }}>Created on</th>
                <th> </th>
              </tr>
            </thead>
            <tbody className="table__body">
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
            </tbody>
          </table>
        </div>
      )}
    </div>
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
