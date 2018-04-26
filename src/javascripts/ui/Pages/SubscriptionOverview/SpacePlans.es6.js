import React from 'react';
import PropTypes from 'prop-types';

import { calculatePlansCost } from 'utils/SubscriptionUtils';

import Pluralized from 'ui/Components/Pluralized';
import Price from 'ui/Components/Price';

import SpacePlanRow from './SpacePlanRow';

function SpacePlans ({spacePlans, onCreateSpace, onDeleteSpace, isOrgOwner}) {
  const numSpaces = spacePlans.length;
  const hasSpacePlans = numSpaces > 0;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return <div>
    <h2 className='section-title'>Spaces</h2>
    <p style={{ marginBottom: '1.5em' }}>
      { !hasSpacePlans &&
        "Your organization doesn't have any spaces. "
      }
      { hasSpacePlans &&
        <span>Your organization has <b><Pluralized text="space" count={numSpaces} /></b>.&#32;</span>
      }
      {
        totalCost > 0 &&
          <span>The total for your spaces is <b><Price value={totalCost} /></b> per month.&#32;</span>
      }
      <a className='text-link' onClick={onCreateSpace}>Add Space</a>
    </p>

    { hasSpacePlans &&
      <table className='simple-table'>
        <thead>
          <tr>
            <th style={{width: '25%'}}>Name</th>
            <th style={{width: '30%'}}>Space type / price</th>
            <th style={{width: '10%'}}>Created by</th>
            <th style={{width: '10%'}}>Created on</th>
            <th style={{width: '25%'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          { spacePlans.map(plan => {
            return <SpacePlanRow
              key={plan.sys.id || plan.space && plan.space.sys.id}
              plan={plan}
              onDeleteSpace={onDeleteSpace}
              isOrgOwner={isOrgOwner}
            />;
          })}
        </tbody>
      </table>
    }
  </div>;
}

SpacePlans.propTypes = {
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired
};

export default SpacePlans;
