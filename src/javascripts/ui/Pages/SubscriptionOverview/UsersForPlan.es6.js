import React from 'react';
import PropTypes from 'prop-types';

import {href} from 'states/Navigator';
import { memberships as orgMemberships } from 'ui/NavStates/Org';

import Pluralized from 'ui/Components/Pluralized';

function UsersForPlan ({ usersMeta, orgId }) {
  const { numFree, numPaid, cost } = usersMeta;
  const numTotal = numFree + numPaid;

  return <div className='users'>
    <h2 className='section-title'>Users</h2>
    <p>
      <span>Your organization has <b><Pluralized text="user" count={numTotal} /></b>.&#32;</span>
      { numPaid > 0 &&
        <span>You are exceeding the limit of <Pluralized text="free user" count={numFree} /> by <Pluralized text="user" count={numPaid} />. That is <b>${cost}</b> per month.&#32;</span>
      }
      <a
        className='text-link'
        href={href(orgMemberships(orgId))}
        data-test-id='subscription-page.org-memberships-link'>
        Manage users
      </a>
    </p>
  </div>;
}

UsersForPlan.propTypes = {
  usersMeta: PropTypes.object.isRequired,
  orgId: PropTypes.string.isRequired
};

export default UsersForPlan;
