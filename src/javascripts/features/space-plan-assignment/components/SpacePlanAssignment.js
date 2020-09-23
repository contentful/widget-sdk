import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Notification } from '@contentful/forma-36-react-components';
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
import { formatError } from '../utils/errors';
import { track } from 'analytics/Analytics';
import { SpacePlanAssignmentConfirmation } from './SpacePlanAssignmentConfirmation';
import { EmptyState } from './EmptyState';
import { AssignmentLoadingCard } from './AssignmentLoadingCard';

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

      // filter plans that already have a space assigned (gatekeeperKey) or are the same as the current plan
      const availablePlans = filter(
        plans.items,
        (plan) => !plan.gatekeeperKey && (currentPlan ? plan.name !== currentPlan.name : true)
      );

      // enhence plans with roleSet in order to display tooltip text for Roles
      const enhancedPlans = availablePlans.map((plan) => {
        return {
          ...plan,
          roleSet: ratePlans.find((ratePlan) => ratePlan.name === plan.name).roleSet,
        };
      });

      return {
        plans: sortBy(enhancedPlans, 'price'),
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
        current_plan_id: data.currentPlan ? data.currentPlan.sys.id : data.freePlan.sys.id,
        current_plan_name: data.currentPlan ? data.currentPlan.name : data.freePlan.name,
        new_plan_id: selectedPlan.sys.id,
        new_plan_name: selectedPlan.name,
        flow: 'assing_plan_to_space',
      });
      window.history.pushState('', null);
    }
  };

  const navigateToPreviousStep = () => {
    if (!selectedPlan) return;

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
      await changeSpacePlanAssignment(
        orgId,
        spaceId,
        selectedPlan,
        data.currentPlan,
        data.freePlan
      );
      Notification.success(`${data.space.name} was successfully changed to ${selectedPlan.name}`);
      go({ path: '^.subscription_new' });
    } catch (e) {
      Notification.error(formatError(e));
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
        {isLoading && <AssignmentLoadingCard />}
        {!isLoading && data?.plans.length === 0 && <EmptyState />}
        {!isLoading && data?.plans.length > 0 && (
          <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
            <Breadcrumbs items={steps} isActive={steps} />
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
