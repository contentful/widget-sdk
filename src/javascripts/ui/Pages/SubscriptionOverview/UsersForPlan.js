import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, TextLink, Heading } from '@contentful/forma-36-react-components';

import { href } from 'states/Navigator';
import { memberships as orgMemberships } from './links';
import Pluralized from 'ui/Components/Pluralized';

const styles = {
  container: css({
    gridColumn: 2,
    gridRow: 1
  })
};

function UsersForPlan({ usersMeta, organizationId }) {
  const { numFree, numPaid, cost } = usersMeta;
  const numTotal = numFree + numPaid;

  return (
    <div className={styles.container}>
      <Heading className="section-title">Users</Heading>
      <Paragraph>
        <>
          Your organization has{' '}
          <b>
            <Pluralized text="user" count={numTotal} />
          </b>
          .{' '}
        </>
        {numPaid > 0 && (
          <>
            You are exceeding the limit of <Pluralized text="free user" count={numFree} /> by{' '}
            <Pluralized text="user" count={numPaid} />. That is <b>${cost}</b> per month.{' '}
          </>
        )}
        <TextLink
          href={href(orgMemberships(organizationId))}
          testId="subscription-page.org-memberships-link">
          Manage users
        </TextLink>
      </Paragraph>
    </div>
  );
}

UsersForPlan.propTypes = {
  usersMeta: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
};

export default UsersForPlan;
