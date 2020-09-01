import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Workbench,
  Button,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonText,
  Card,
  SkeletonImage,
  Notification,
} from '@contentful/forma-36-react-components';
import { NavigationIcon, Grid, Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsync } from 'core/hooks';
import { getSubscriptionPlans, updateSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { SpacePlanSelection } from './SpacePlanSelection';
import createResourceService from 'services/ResourceService';
import { sortBy, keyBy, filter } from 'lodash';
import { Breadcrumbs } from 'features/breadcrumbs';
import { go } from 'states/Navigator';

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
        // filter plans that already have a space assigned (gatekeeperKey), and sort by price
        plans: sortBy(
          filter(plans.items, (plan) => !plan.gatekeeperKey),
          'price'
        ),
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

  const submit = async () => {
    const orgEndpoint = createOrganizationEndpoint(orgId);

    const updatedPlan = {
      ...selectedPlan,
      gatekeeperKey: spaceId,
    };

    try {
      await updateSpacePlan(orgEndpoint, updatedPlan);
      Notification.success(`${data.space.name} was successfully changed to ${selectedPlan.name}`);
      go({ path: '^.subscription_new' });
    } catch (e) {
      Notification.error(e.message);
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<NavigationIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumbs items={steps} isActive={steps} />
          {isLoading && (
            <>
              <SkeletonContainer svgHeight={40}>
                <SkeletonText width={300} offsetTop={10} />
              </SkeletonContainer>
              <Card>
                <SkeletonContainer svgHeight={100}>
                  <SkeletonImage
                    width={16}
                    height={16}
                    radiusX={16}
                    radiusY={16}
                    offsetLeft={12}
                    offsetTop={24}
                  />
                  <SkeletonDisplayText offsetTop={24} offsetLeft={40} width={80} />
                  <SkeletonBodyText
                    offsetTop={70}
                    offsetLeft={40}
                    lineHeight={12}
                    numberOfLines={1}
                  />
                </SkeletonContainer>
              </Card>
            </>
          )}
          {!isLoading && data && (
            <>
              {steps.indexOf(currentStep) === 0 && (
                <SpacePlanSelection
                  space={data.space}
                  spaceResources={data.spaceResources}
                  plans={data.plans}
                  selectedPlan={selectedPlan}
                  onPlanSelected={setSelectedPlan}
                  onNext={submit}
                />
              )}
              {steps.indexOf(currentStep) === 1 && (
                <>
                  <div>I will be a confirmation layer</div>
                  <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
                    <Button buttonType="muted" onClick={navigateToPreviousStep} icon="ChevronLeft">
                      Go back
                    </Button>
                    <Button buttonType="primary" onClick={navigateToNextStep}>
                      Continue
                    </Button>
                  </Flex>
                </>
              )}
            </>
          )}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
}

SpacePlanAssignment.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
};
