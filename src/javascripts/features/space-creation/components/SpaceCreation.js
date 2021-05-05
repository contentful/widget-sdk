import React, { useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Grid, Workbench, Notification } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';
import { LoadingCard } from './LoadingCard';
import { SpaceCreationConfirm } from './SpaceCreationConfirm';
import { SpaceDetailsSetupStep } from './SpaceDetailsSetupStep';
import { spaceCreation, createSpaceWithTemplate } from '../services/SpaceCreationService';
import { actions, SpaceCreationState } from '../context';
import * as Navigator from 'states/Navigator';
import { captureError } from 'core/monitoring';
import { track } from 'analytics/Analytics';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { useAsync } from 'core/hooks/useAsync';
import { SpacePlanSelection } from 'features/space-plan-assignment';
import { CREATION_FLOW_TYPE, getPlansData } from '../utils/utils';
import {
  wait,
  LOADING_SCREEN_COMPLETED_TIME,
  LOADING_SCREEN_MINIMUM_TIME,
} from 'features/space-management';
import { WizardFixedFooter } from 'features/space-management';
import * as Intercom from 'services/intercom';
import { salesUrl } from 'Config';
import { StepStatus, LoadingStateIllustrated } from 'features/space-management';
import { clearTrialsCache } from 'features/trials';

const styles = {
  workbenchContent: css({
    padding: `${tokens.spacingL} 0 6.5rem 0`,
  }),
  // hack for workbench component to be able to display full width footer
  grid: css({
    maxWidth: '1280px',
    margin: '0 auto',
    paddingBottom: tokens.spacingL,
  }),
};

export const SpaceCreation = ({ orgId }) => {
  const {
    state: { selectedPlan, spaceName, selectedTemplate },
    dispatch,
  } = useContext(SpaceCreationState);

  const CREATE_SPACE_STEPS = [
    { text: '1.Space type', isActive: selectedPlan ? false : true },
    { text: '2.Space details', isActive: selectedPlan ? true : false },
    { text: '3.Confirmation', isActive: false },
  ];

  const [steps, setSteps] = useState(CREATE_SPACE_STEPS);
  const [status, setStatus] = useState(null);
  const currentStep = steps.find((item) => item.isActive);

  const { isLoading, data } = useAsync(useCallback(getPlansData(orgId), []));

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
    const startTime = Date.now();
    setStatus(StepStatus.RUNNING);
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
      setStatus(StepStatus.COMPLETED);
      clearTrialsCache();
      // to avoid ui flashes for the second step in the LoadingStateIllustrated we expect
      // the loading screen to remain for a minimum amount of time
      await wait(LOADING_SCREEN_COMPLETED_TIME);
      Navigator.go({ path: ['account', 'organizations', 'subscription_new', 'overview'] });
      Notification.success(`${spaceName} was created successfully`);
    } catch (error) {
      setStatus(StepStatus.FAILED);
      Notification.error(`${spaceName} could not be created`);
      captureError(error);
    }

    //  show the loading state for a minimum amount of time
    if (Date.now() - startTime <= LOADING_SCREEN_MINIMUM_TIME) {
      await wait(LOADING_SCREEN_MINIMUM_TIME - (Date.now() - startTime));
    }
  };

  const handleGetInTouchClick = () => {
    track('space_creation:get_in_touch', {
      flow: 'space_creation',
    });

    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(salesUrl);
    }
  };

  if (isLoading) {
    return (
      <Workbench>
        <Workbench.Header
          title="Subscription"
          icon={<ProductIcon icon="Subscription" size="large" />}
        />
        <Workbench.Content className={styles.workbenchContent}>
          <LoadingCard />
        </Workbench.Content>
      </Workbench>
    );
  }

  // Animated loading state for space creation progress
  if (!isLoading && data && status && status !== StepStatus.FAILED) {
    return <LoadingStateIllustrated status={status} />;
  }

  if (!isLoading && data) {
    return (
      <Workbench>
        <Workbench.Header
          title="Subscription"
          icon={<ProductIcon icon="Subscription" size="large" />}
        />
        <Workbench.Content className={styles.workbenchContent}>
          <Grid columns={1} rowGap="spacingM">
            <Breadcrumbs items={steps} isActive={steps} />
            {steps.indexOf(currentStep) === 0 && (
              <SpacePlanSelection
                flowType={CREATION_FLOW_TYPE}
                productRatePlans={data.productRatePlans}
                selectedPlan={selectedPlan}
                plans={[...data.plans, data.freePlan]}
                onPlanSelected={(plan) =>
                  dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan })
                }
                freeSpaceResource={data.freeSpaceResource}
              />
            )}
            {steps.indexOf(currentStep) === 1 && (
              <SpaceDetailsSetupStep
                onBack={navigateToPreviousStep}
                onSubmit={navigateToNextStep}
              />
            )}
            {steps.indexOf(currentStep) === 2 && (
              <SpaceCreationConfirm onPrev={navigateToPreviousStep} onNext={submit} />
            )}
          </Grid>

          {steps.indexOf(currentStep) === 0 && data && (
            <WizardFixedFooter
              continueBtnDisabled={
                !selectedPlan ||
                ([...data.plans, data.freePlan].length === 1 &&
                  data?.freeSpaceResource?.limits?.maximum - data.freeSpaceResource?.usage === 0)
              }
              onNext={navigateToNextStep}
              flowType={CREATION_FLOW_TYPE}
              handleGetInTouchClick={handleGetInTouchClick}
              spaceId={data.space?.sys?.id}
            />
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
};

SpaceCreation.propTypes = {
  orgId: PropTypes.string.isRequired,
};
