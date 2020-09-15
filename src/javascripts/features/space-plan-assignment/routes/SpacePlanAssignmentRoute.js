import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { SpacePlanAssignment } from '../components/SpacePlanAssignment';
import { PlanSpaceAssignment } from '../components/PlanSpaceAssignment';
import { useAsync } from 'core/hooks/useAsync';
import queryString from 'query-string';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import StateRedirect from 'app/common/StateRedirect';

const initialFetch = async () => {
  const spaceAssignmentEnabled = await getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT);
  const qs = queryString.parse(window.location.search);

  return {
    spaceAssignmentEnabled,
    spaceId: qs.spaceId,
    planId: qs.planId,
  };
};

export const SpacePlanAssignmentRoute = ({ orgId }) => {
  const { isLoading, data } = useAsync(useCallback(initialFetch, []));
  if (isLoading) {
    return (
      <EmptyStateContainer>
        <Spinner size="large" />
      </EmptyStateContainer>
    );
  }

  // redirect when data, but flag is disabled or spaceId and planId is not in the queryString
  if (data && (!data.spaceAssignmentEnabled || (!data.spaceId && !data.planId))) {
    return <StateRedirect path="^.subscription_new" />;
  }

  // assign space to plan when flag is enabled and planId is present in the queryString
  if (data && data.spaceAssignmentEnabled && data.planId) {
    return <PlanSpaceAssignment orgId={orgId} planId={data.planId} />;
  }

  // assign plan to space when flag is enabled and spaceId is present in the queryString
  return <SpacePlanAssignment orgId={orgId} spaceId={data.spaceId} />;
};

SpacePlanAssignmentRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
