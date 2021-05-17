import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { SpacePlanAssignment } from '../components/SpacePlanAssignment';
import { PlanSpaceAssignment } from '../components/PlanSpaceAssignment';
import { useAsync } from 'core/hooks/useAsync';
import { LoadingEmptyState } from 'features/loading-state';
import { ReactRouterRedirect, useSearchParams } from 'core/react-routing';

const initialFetch = async ({ orgId, spaceId, planId }) => {
  const spaceAssignmentEnabled = await getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT, {
    organizationId: orgId,
  });

  return {
    spaceAssignmentEnabled,
    spaceId,
    planId,
  };
};

export const SpacePlanAssignmentRoute = ({ orgId }) => {
  const [searchParams] = useSearchParams({ spaceId: '', planId: '' });
  const spaceId = searchParams.get('spaceId') || null;
  const planId = searchParams.get('planId') || null;
  const { isLoading, data } = useAsync(
    useCallback(() => initialFetch({ orgId, planId, spaceId }), [orgId, planId, spaceId])
  );

  if (isLoading) {
    return <LoadingEmptyState />;
  }

  // redirect when data, but flag is disabled or spaceId and planId is not in the queryString
  if (data && (!data.spaceAssignmentEnabled || (!spaceId && !planId))) {
    return <ReactRouterRedirect route={{ path: 'organizations.subscription.overview', orgId }} />;
  }

  // assign space to plan when flag is enabled and planId is present in the queryString
  if (data && data.spaceAssignmentEnabled && planId) {
    return <PlanSpaceAssignment orgId={orgId} planId={planId} />;
  }

  // assign plan to space when flag is enabled and spaceId is present in the queryString
  return <SpacePlanAssignment orgId={orgId} spaceId={spaceId} />;
};

SpacePlanAssignmentRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
