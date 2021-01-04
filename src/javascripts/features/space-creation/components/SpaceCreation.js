import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Notification } from '@contentful/forma-36-react-components';
import { ProductIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';
import { SpacePlanStep } from './SpacePlanStep';
import { SpaceCreationConfirm } from './SpaceCreationConfirm';
import { SpaceDetailsSetupStep } from './SpaceDetailsSetupStep';
import { spaceCreation, createSpaceWithTemplate } from '../services/SpaceCreationService';
import { SpaceCreationState } from '../context';
import * as Navigator from 'states/Navigator';
import { logError } from 'services/logger';
import { track } from 'analytics/Analytics';

export const SpaceCreation = ({ orgId }) => {
  const {
    state: { selectedPlan, spaceName, selectedTemplate },
  } = useContext(SpaceCreationState);

  const CREATE_SPACE_STEPS = [
    { text: '1.Choose space type', isActive: selectedPlan ? false : true },
    { text: '2.Enter space details', isActive: selectedPlan ? true : false },
    { text: '3.Confirm', isActive: false },
  ];
  const [steps, setSteps] = useState(CREATE_SPACE_STEPS);
  const [inProgress, setInProgress] = useState(false);
  const currentStep = steps.find((item) => item.isActive);

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
      track('space_creation:continue', {
        selected_plan_id: selectedPlan.sys.id,
        selected_plan_name: selectedPlan.name,
        flow: 'space_creation',
      });
    }
  };

  const navigateToPreviousStep = () => {
    const currentStepIndex = steps.indexOf(currentStep);
    const previousStep = steps[currentStepIndex - 1];

    if (previousStep) {
      navigateToStep(previousStep);
      track('space_creation:back', {
        selected_plan_id: selectedPlan.sys.id,
      });
    }
  };

  const submit = async () => {
    setInProgress(true);
    try {
      if (selectedTemplate !== null) {
        await createSpaceWithTemplate({ orgId, spaceName, selectedPlan, selectedTemplate });
        track('space_creation:confirm', {
          selected_plan_id: selectedPlan.sys.id,
          selected_plan_name: selectedPlan.name,
          space_type: 'space_with_template',
          flow: 'space_creation',
        });
      } else {
        await spaceCreation(orgId, spaceName, selectedPlan);
        track('space_creation:confirm', {
          selected_plan_id: selectedPlan.sys.id,
          selected_plan_name: selectedPlan.name,
          space_type: 'empty_space',
          flow: 'space_creation',
        });
      }
      Navigator.go({ path: ['account', 'organizations', 'subscription_new', 'overview'] });
      Notification.success(`${spaceName} was created successfully`);
    } catch (error) {
      Notification.error(`${spaceName} could not be created`);
      logError('Could not create space', { error });
    }
    setInProgress(false);
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<ProductIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumbs items={steps} isActive={steps} />
          {steps.indexOf(currentStep) === 0 && (
            <SpacePlanStep orgId={orgId} onNext={navigateToNextStep} />
          )}
          {steps.indexOf(currentStep) === 1 && (
            <SpaceDetailsSetupStep onBack={navigateToPreviousStep} onSubmit={navigateToNextStep} />
          )}
          {steps.indexOf(currentStep) === 2 && (
            <SpaceCreationConfirm
              onPrev={navigateToPreviousStep}
              onNext={submit}
              inProgress={inProgress}
            />
          )}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};

SpaceCreation.propTypes = {
  orgId: PropTypes.string.isRequired,
};
