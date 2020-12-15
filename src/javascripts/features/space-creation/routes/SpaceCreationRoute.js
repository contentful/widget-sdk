import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { SpaceCreation } from '../components/SpaceCreation';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useAsync } from 'core/hooks';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { Spinner } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';

const initialFetch = async (orgId) => {
  const canCreateSpaceWithPlan = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN, {
    organizationId: orgId,
  });
  const qs = queryString.parse(window.location.search);

  return {
    canCreateSpaceWithPlan,
    planId: qs.planId,
  };
};

export const SpaceCreationRoute = ({ orgId }) => {
  const { isLoading, data } = useAsync(useCallback(() => initialFetch(orgId), [orgId]));
  if (isLoading) {
    return (
      <EmptyStateContainer>
        <Spinner size="large" />
      </EmptyStateContainer>
    );
  }

  // redirect when data, but flag is disabled
  if (data && !data.canCreateSpaceWithPlan) {
    return <StateRedirect path="^" />;
  }

  return <SpaceCreation orgId={orgId} planId={data.planId} />;
};

SpaceCreationRoute.propTypes = {
  orgId: PropTypes.string,
};
