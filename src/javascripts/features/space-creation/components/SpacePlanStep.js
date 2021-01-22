import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import { SpacePlanSelection } from 'features/space-plan-assignment';
import { LoadingCard } from './LoadingCard';
import { actions, SpaceCreationState } from '../context';
import { useAsync } from 'core/hooks/useAsync';
import { getProductPlans } from 'account/pricing/PricingDataProvider';
import { getSpaceRatePlans } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';
import createResourceService from 'services/ResourceService';
import { CREATION_FLOW_TYPE } from '../utils/utils';

const DEFAULT_ROLE_SET = { roles: ['Editor'] };

export const SpacePlanStep = ({ orgId, onNext }) => {
  const {
    state: { selectedPlan },
    dispatch,
  } = useContext(SpaceCreationState);
  const getPlans = useCallback(async () => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const orgResources = createResourceService(orgId, 'organization');

    const [plans, ratePlans, freeSpaceResource] = await Promise.all([
      getSpaceRatePlans(orgEndpoint),
      getProductPlans(orgEndpoint),
      orgResources.get(FREE_SPACE_IDENTIFIER),
    ]);

    const freeSpaceRatePlan = ratePlans.find(
      (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
    );
    // filter plans that already have a space assigned (gatekeeperKey)
    const availablePlans = plans.items.filter((plan) => !plan.gatekeeperKey);

    // enhence plans with roleSet in order to display tooltip text for Roles
    const enhancedPlans = availablePlans.map((plan) => {
      return {
        ...plan,
        roleSet:
          ratePlans.find((ratePlan) => ratePlan.name === plan.name)?.roleSet ?? DEFAULT_ROLE_SET,
      };
    });

    return {
      plans: sortBy(enhancedPlans, 'price'),
      ratePlans,
      freePlan: freeSpaceRatePlan,
      freeSpaceResource,
    };
  }, [orgId]);

  const { isLoading, data } = useAsync(getPlans);

  return (
    <>
      {isLoading && <LoadingCard />}
      {!isLoading && data && (
        <SpacePlanSelection
          flowType={CREATION_FLOW_TYPE}
          ratePlans={data.ratePlans}
          selectedPlan={selectedPlan}
          plans={[...data.plans, data.freePlan]}
          onPlanSelected={(plan) => dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan })}
          onNext={onNext}
          showComparison={false}
          freePlan={data.freePlan}
          freeSpaceResource={data.freeSpaceResource}
        />
      )}
    </>
  );
};

SpacePlanStep.propTypes = {
  orgId: PropTypes.string.isRequired,
  onNext: PropTypes.func.isRequired,
};
