import React from 'react';
import PropTypes from 'prop-types';

import { Paragraph, TextLink, Heading } from '@contentful/forma-36-react-components';

import { memberships as orgMemberships } from './links';
import { Pluralized } from 'core/components/formatting';
import StateLink from 'app/common/StateLink';

function UsersForPlan({ organizationId, numberFreeUsers, numberPaidUsers, costOfUsers }) {
  const totalOfUsers = numberFreeUsers + numberPaidUsers;

  return (
    <div data-test-id="users-for-plan">
      <Heading className="section-title">Users</Heading>
      <Paragraph>
        Your organization has{' '}
        <b>
          <Pluralized text="user" count={totalOfUsers} />
        </b>
        .{' '}
        {numberPaidUsers > 0 && (
          <>
            <br />
            You are exceeding the limit of <Pluralized
              text="free user"
              count={numberFreeUsers}
            />{' '}
            by <Pluralized text="user" count={numberPaidUsers} />.
            <br />
            That is <strong>${costOfUsers}</strong> per month.{' '}
          </>
        )}
        <StateLink
          {...orgMemberships(organizationId)}
          component={TextLink}
          testId="subscription-page.org-memberships-link">
          Manage users
        </StateLink>
      </Paragraph>
    </div>
  );
}

UsersForPlan.propTypes = {
  organizationId: PropTypes.string.isRequired,
  numberFreeUsers: PropTypes.number,
  numberPaidUsers: PropTypes.number,
  costOfUsers: PropTypes.number,
};

UsersForPlan.defaultProps = {
  numberFreeUsers: 0,
  numberPaidUsers: 0,
  costOfUsers: 0,
};

export default UsersForPlan;
