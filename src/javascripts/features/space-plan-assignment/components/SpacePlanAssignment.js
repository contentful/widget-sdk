import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Button } from '@contentful/forma-36-react-components';
import { NavigationIcon, Grid, Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsync } from 'core/hooks';
import { getSubscriptionPlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { SpacePlanSelection } from './SpacePlanSelection';
import createResourceService from 'services/ResourceService';
import { sortBy, keyBy } from 'lodash';
import { Breadcrumbs } from 'features/breadcrumbs';

const ASSIGNMENT_STEPS = [
  { text: '1.New space type', isActive: true },
  { text: '2.Confirm', isActive: false },
];

export function SpacePlanAssignment({ orgId, spaceId }) {
  const [selectedPlan, setSelectedPlan] = useState();
  const [steps, setSteps] = useState(ASSIGNMENT_STEPS);
  const currentStep = steps.find((item) => item.isActive);

  const { isLoading, data } = useAsync(
    useCallback(async () => {
      const orgEndpoint = createOrganizationEndpoint(orgId);
      const spaceEndpoint = createSpaceEndpoint(spaceId);
      const resourceService = createResourceService(spaceId, 'space');

      const [plans, space, spaceResources] = await Promise.all([
        getSubscriptionPlans(orgEndpoint, { plan_type: 'space' }),
        getSpace(spaceEndpoint),
        resourceService.getAll(),
      ]);

      return {
        plans: sortBy(plans.items, 'price'),
        space,
        spaceResources: keyBy(spaceResources, 'sys.id'),
      };
    }, [orgId, spaceId])
  );

  const navigateToStep = (newStep) => {
    const updatedSteps = steps.map((step) => {
      if (step === newStep) {
        return { ...step, isActive: true };
      }

      return { ...step, isActive: false };
    });

    setSteps(updatedSteps);
  };

  const navigateToNextStep = () => {
    const currentStepIndex = steps.indexOf(currentStep);
    const nextStep = steps[currentStepIndex + 1];

    if (nextStep) {
      navigateToStep(nextStep);
      window.history.pushState('', null);
    }
  };

  const navigateToPreviousStep = () => {
    const currentStepIndex = steps.indexOf(currentStep);
    const previousStep = steps[currentStepIndex - 1];

    if (previousStep) {
      navigateToStep(previousStep);
      window.history.back();
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<NavigationIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        {isLoading && 'Loading'}
        {!isLoading && data && (
          <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
            <Breadcrumbs items={steps} isActive={steps} />
            {steps.indexOf(currentStep) === 0 && (
              <SpacePlanSelection
                space={data.space}
                spaceResources={data.spaceResources}
                plans={data.plans}
                selectedPlan={selectedPlan}
                onPlanSelected={setSelectedPlan}
                handleNavigationNext={navigateToNextStep}
              />
            )}
            {steps.indexOf(currentStep) === 1 && (
              <>
                <div>I will be a confirmation layer</div>
                <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
                  <Button buttonType="muted" onClick={navigateToPreviousStep}>
                    Go back
                  </Button>
                  <Button buttonType="primary" onClick={navigateToNextStep}>
                    Continue
                  </Button>
                </Flex>
              </>
            )}
          </Grid>
        )}
      </Workbench.Content>
    </Workbench>
  );
}

SpacePlanAssignment.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
};
