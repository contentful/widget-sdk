import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Workbench,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonText,
  Card,
  SkeletonImage,
  Notification,
} from '@contentful/forma-36-react-components';
import { NavigationIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsync } from 'core/hooks';
import { getSubscriptionPlans, getRatePlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { SpacePlanSelection } from './SpacePlanSelection';
import createResourceService from 'services/ResourceService';
import { sortBy, keyBy, filter } from 'lodash';
import { Breadcrumbs } from 'features/breadcrumbs';
import { go } from 'states/Navigator';
import { changeSpacePlanAssignment } from '../services/SpacePlanAssignmentService';
import { track } from 'analytics/Analytics';
import { SpacePlanAssignmentConfirmation } from './SpacePlanAssignmentConfirmation';

const ASSIGNMENT_STEPS = [
  { text: '1.New space type', isActive: true },
  { text: '2.Confirm', isActive: false },
];

export function SpacePlanAssignment({ orgId, spaceId }) {
  const [selectedPlan, setSelectedPlan] = useState();
  const [steps, setSteps] = useState(ASSIGNMENT_STEPS);
  const [inProgress, setInProgress] = useState(false);

  const currentStep = steps.find((item) => item.isActive);

  const { isLoading, data } = useAsync(
    useCallback(async () => {
      const orgEndpoint = createOrganizationEndpoint(orgId);
      const spaceEndpoint = createSpaceEndpoint(spaceId);
      const resourceService = createResourceService(spaceId, 'space');

      const [plans, ratePlans, space, spaceResources] = await Promise.all([
        getSubscriptionPlans(orgEndpoint, { plan_type: 'space' }),
        getRatePlans(orgEndpoint),
        getSpace(spaceEndpoint),
        resourceService.getAll(),
      ]);

      const freePlan = ratePlans.find((plan) => plan.productPlanType === 'free_space');
      const currentPlan = plans.items.find((plan) => plan.gatekeeperKey === spaceId);

      return {
        // filter plans that already have a space assigned (gatekeeperKey), and sort by price
        plans: sortBy(
          filter(plans.items, (plan) => !plan.gatekeeperKey),
          'price'
        ),
        space,
        currentPlan,
        freePlan,
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
      track('space_assignment:continue', {
        space_id: spaceId,
        // TODO: to be adjusted as soon as we merge missing component
        selected_plan_id: selectedPlan.sys.id,
        selected_plan_name: selectedPlan.name,
      });
      window.history.pushState('', null);
    }
  };

  const navigateToPreviousStep = () => {
    const currentStepIndex = steps.indexOf(currentStep);
    const previousStep = steps[currentStepIndex - 1];

    if (previousStep) {
      navigateToStep(previousStep);
      track('space_assignment:back', {
        space_id: spaceId,
      });
      window.history.back();
    }
  };

  const submit = async () => {
    try {
      setInProgress(true);
      await changeSpacePlanAssignment(orgId, spaceId, selectedPlan, data.currentPlan);
      Notification.success(`${data.space.name} was successfully changed to ${selectedPlan.name}`);
      go({ path: '^.subscription_new' });
    } catch (e) {
      Notification.error(e.message);
    } finally {
      setInProgress(false);
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
                  onNext={navigateToNextStep}
                />
              )}
              {steps.indexOf(currentStep) === 1 && (
                <SpacePlanAssignmentConfirmation
                  currentPlan={data.currentPlan ?? data.freePlan}
                  selectedPlan={selectedPlan}
                  space={data.space}
                  spaceResources={data.spaceResources}
                  onPrev={navigateToPreviousStep}
                  onNext={submit}
                  inProgress={inProgress}
                />
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
