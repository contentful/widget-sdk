import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { SpaceCreation } from '../components/SpaceCreation';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useAsync } from 'core/hooks';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { Spinner } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';
import { getSubscriptionPlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { actions, SpaceCreationState } from '../context';
import { getTemplatesList } from 'services/SpaceTemplateLoader';

const initialFetch = (orgId, dispatch) => async () => {
  const canCreateSpaceWithPlan = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN, {
    organizationId: orgId,
  });
  const qs = queryString.parse(window.location.search);
  const planId = qs.planId;

  const endpoint = createOrganizationEndpoint(orgId);
  const [spacePlans, templatesList] = await Promise.all([
    getSubscriptionPlans(endpoint, { plan_type: 'space' }),
    getTemplatesList(),
  ]);

  const selectedPlan = spacePlans.items.find((plan) => plan.sys.id === planId);

  dispatch({
    type: actions.SET_INITIAL_STATE,
    payload: {
      selectedPlan,
      templatesList,
    },
  });

  return {
    canCreateSpaceWithPlan,
  };
};

export const SpaceCreationRoute = ({ orgId }) => {
  const { dispatch } = useContext(SpaceCreationState);

  const { isLoading, data } = useAsync(useCallback(initialFetch(orgId, dispatch), []));

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

  if (!isLoading) {
    return <SpaceCreation orgId={orgId} />;
  }
};

SpaceCreationRoute.propTypes = {
  orgId: PropTypes.string,
};
