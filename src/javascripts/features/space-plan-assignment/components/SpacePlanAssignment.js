import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, Workbench, Notification } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsync } from 'core/hooks';
import { getSpacePlans, getAllProductRatePlans } from 'features/pricing-entities';
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
import { LoadingCard } from 'features/space-creation';
import { ASSIGNMENT_FLOW_TYPE } from '../utils/utils';

const ASSIGNMENT_STEPS = [
  { text: '1.Choose space type', isActive: true },
  { text: '2.Confirm', isActive: false },
];

const DEFAULT_ROLE_SET = { roles: ['Editor'] };

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

      const [plans, productRatePlans, space, spaceResources] = await Promise.all([
        getSpacePlans(orgEndpoint),
        getAllProductRatePlans(orgEndpoint),
        getSpace(spaceEndpoint),
        resourceService.getAll(),
      ]);

      const freePlan = productRatePlans.find((plan) => plan.productPlanType === 'free_space');

      // TODO(mire): remove the temporary solution when a new plan is mapped
      if (freePlan.name === 'Unassigned') {
        freePlan.name = 'Trial Space';
      }

      const currentPlan = plans.find((plan) => plan.gatekeeperKey === spaceId);

      // filter plans that already have a space assigned (gatekeeperKey)
      const availablePlans = filter(plans, (plan) => !plan.gatekeeperKey);

      // enhence plans with roleSet in order to display tooltip text for Roles
      const enhancedPlans = availablePlans.map((plan) => {
        return {
          ...plan,
          roleSet:
            productRatePlans.find((ratePlan) => ratePlan.name === plan.name)?.roleSet ??
            DEFAULT_ROLE_SET,
        };
      });

      return {
        ratePlans: productRatePlans,
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
      go({ path: '^' });
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
        icon={<ProductIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        {isLoading && <LoadingCard />}
        {!isLoading && data?.plans.length === 0 && <EmptyState />}
        {!isLoading && data?.plans.length > 0 && (
          <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
            <Breadcrumbs items={steps} isActive={steps} />
            {steps.indexOf(currentStep) === 0 && (
              <SpacePlanSelection
                flowType={ASSIGNMENT_FLOW_TYPE}
                space={data.space}
                spaceResources={data.spaceResources}
                plans={data.plans}
                ratePlans={data.ratePlans}
                selectedPlan={selectedPlan}
                currentPlan={data.currentPlan ? data.currentPlan : data.freePlan}
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
