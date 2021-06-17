import React from 'react';
import PropTypes from 'prop-types';

import { SpacePlanAssignment } from '../components/SpacePlanAssignment';
import { ReactRouterRedirect, useSearchParams } from 'core/react-routing';

export const SpacePlanAssignmentRoute = ({ orgId }) => {
  const [searchParams] = useSearchParams({ spaceId: '', planId: '' });
  const spaceId = searchParams.get('spaceId') || null;
  const planId = searchParams.get('planId') || null;

  // redirect when spaceId and planId is not in the queryString
  if (!spaceId && !planId) {
    return <ReactRouterRedirect route={{ path: 'organizations.subscription.overview', orgId }} />;
  }

  // assign plan to space when flag is enabled and spaceId is present in the queryString
  return <SpacePlanAssignment orgId={orgId} spaceId={spaceId} />;
};

SpacePlanAssignmentRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
