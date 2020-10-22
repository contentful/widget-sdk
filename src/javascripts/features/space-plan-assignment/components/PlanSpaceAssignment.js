import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics';

import { Workbench, Notification } from '@contentful/forma-36-react-components';
import { ProductIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';
import { useAsync } from 'core/hooks';
import { getSubscriptionPlans, getRatePlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { SpaceSelection } from './SpaceSelection';
import { SpacePlanAssignmentConfirmation } from './SpacePlanAssignmentConfirmation';
import { go } from 'states/Navigator';
import { changeSpacePlanAssignment } from '../services/SpacePlanAssignmentService';
import { formatError } from '../utils/errors';
import { keyBy } from 'lodash';
import createResourceService from 'services/ResourceService';
import { AssignmentLoadingCard } from './AssignmentLoadingCard';
import { EmptyState } from './EmptyState';

const ASSIGNMENT_STEPS = [
  { text: '1.Choose space', isActive: true },
  { text: '2.Confirm', isActive: false },
];

export function PlanSpaceAssignment({ orgId, planId }) {
  const [selectedSpace, setSelectedSpace] = useState();
  const [steps, setSteps] = useState(ASSIGNMENT_STEPS);
  const [inProgress, setInProgress] = useState(false);

  const currentStep = steps.find((item) => item.isActive);

  const { isLoading, data } = useAsync(
    useCallback(async () => {
      const orgEndpoint = createOrganizationEndpoint(orgId);

      const [plans, ratePlans, spaces] = await Promise.all([
        getSubscriptionPlans(orgEndpoint, { plan_type: 'space' }),
        getRatePlans(orgEndpoint),
        getAllSpaces(orgEndpoint),
      ]);

      const planToBeAssigned = plans.items.find((plan) => plan.sys.id === planId);

      const allResources = await Promise.all(
        spaces.map((space) => createResourceService(space.sys.id, 'space').getAll())
      );
      // Create an object with resource id and resource details as (key, value) and map it to space id
      const spaceResourcesBySpace = {};
      spaces.forEach(
        (space, idx) => (spaceResourcesBySpace[space.sys.id] = keyBy(allResources[idx], 'sys.id'))
      );

      const freePlan = ratePlans.find((plan) => plan.productPlanType === 'free_space');
      // Assigned plans by space needed for filtering and confirmation screen
      const plansBySpace = {};
      spaces.forEach((space) => {
        const currentSpacePlan = plans.items.find((plan) => plan.gatekeeperKey === space.sys.id);
        plansBySpace[space.sys.id] = currentSpacePlan || freePlan;
      });

      return {
        // filter out spaces that already have this space type
        spaces: spaces.filter((space) => plansBySpace[space.sys.id].name !== planToBeAssigned.name),
        plansBySpace,
        plan: planToBeAssigned,
        freePlan,
        spaceResourcesBySpace,
      };
    }, [orgId, planId])
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
        new_plan_id: data.plan.sys.id,
        new_plan_name: data.plan.name,
        current_plan_id: data.plansBySpace[selectedSpace.sys.id].sys.id,
        current_plan_name: data.plansBySpace[selectedSpace.sys.id].name,
        selected_space_id: selectedSpace.sys.id,
        flow: 'assing_space_to_plan',
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
        new_plan_id: data.plan.sys.id,
        new_plan_name: data.plan.name,
      });
      window.history.back();
    }
  };

  const submit = async () => {
    try {
      setInProgress(true);
      await changeSpacePlanAssignment(
        orgId,
        selectedSpace.sys.id,
        data.plan,
        data.plansBySpace[selectedSpace.sys.id],
        data.freePlan
      );
      Notification.success(`${selectedSpace.name} was successfully changed to ${data.plan.name}`);
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
        {isLoading && <AssignmentLoadingCard />}
        {!isLoading && data?.spaces.length === 0 && <EmptyState />}
        {!isLoading && data && (
          <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
            <Breadcrumbs items={steps} isActive={steps} />
            {steps.indexOf(currentStep) === 0 && (
              <SpaceSelection
                spaces={data.spaces}
                plan={data.plan}
                plansBySpace={data.plansBySpace}
                spaceResourcesBySpace={data.spaceResourcesBySpace}
                selectedSpace={selectedSpace}
                onSpaceSelected={setSelectedSpace}
                onNext={navigateToNextStep}
              />
            )}
            {steps.indexOf(currentStep) === 1 && (
              <SpacePlanAssignmentConfirmation
                currentPlan={data.plansBySpace[selectedSpace.sys.id]}
                selectedPlan={data.plan}
                space={selectedSpace}
                spaceResources={data.spaceResourcesBySpace[selectedSpace.sys.id]}
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

PlanSpaceAssignment.propTypes = {
  orgId: PropTypes.string.isRequired,
  planId: PropTypes.string.isRequired,
};
