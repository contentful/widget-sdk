import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { Spinner } from '@contentful/forma-36-react-components';

import { getVariation, FLAGS } from 'LaunchDarkly';
import { SpacePlanAssignment } from '../components/SpacePlanAssignment';
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

  if (data && (!data.spaceAssignmentEnabled || !data.spaceId)) {
    return <StateRedirect path="^.subscription_new" />;
  }

  return <SpacePlanAssignment orgId={orgId} spaceId={data.spaceId} />;
};

SpacePlanAssignmentRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
