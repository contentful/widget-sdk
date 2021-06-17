import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { SpaceCreation } from '../components/SpaceCreation';
import { FLAGS, getVariation } from 'core/feature-flags';
import { useAsync } from 'core/hooks';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { Spinner } from '@contentful/forma-36-react-components';
import { RouteNavigate } from 'core/react-routing';
import { getSpacePlans, getAllProductRatePlans } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { actions, SpaceCreationState } from '../context';
import { getTemplatesList } from 'services/SpaceTemplateLoader';

const DEFAULT_ROLE_SET = { roles: ['Editor'] };

const initialFetch = (orgId, dispatch) => async () => {
  const canCreateSpaceWithPlan = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN, {
    organizationId: orgId,
  });
  const qs = queryString.parse(window.location.search);
  const planId = qs.planId;

  const endpoint = createOrganizationEndpoint(orgId);
  const [spacePlans, ratePlans, templatesList] = await Promise.all([
    getSpacePlans(endpoint),
    getAllProductRatePlans(endpoint),
    getTemplatesList(),
  ]);

  const selectedPlan = spacePlans.find((plan) => plan.sys.id === planId);
  let enhancedPlan;
  if (selectedPlan) {
    // enhance selectedPlan with roleSet in order to display tooltip text for Roles
    enhancedPlan = {
      ...selectedPlan,
      roleSet:
        ratePlans.find((ratePlan) => ratePlan.name === selectedPlan.name)?.roleSet ??
        DEFAULT_ROLE_SET,
    };
  }

  dispatch({
    type: actions.SET_INITIAL_STATE,
    payload: {
      selectedPlan: enhancedPlan,
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
    return <RouteNavigate route={{ path: 'organizations.subscription.overview', orgId }} replace />;
  }

  return <SpaceCreation orgId={orgId} />;
};

SpaceCreationRoute.propTypes = {
  orgId: PropTypes.string,
};
