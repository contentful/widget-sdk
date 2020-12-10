import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';
import { SpacePlanStep } from './SpacePlanStep';

const CREATE_SPACE_STEPS = [
  { text: '1.Choose space type', isActive: true },
  { text: '2.Enter space details', isActive: false },
  { text: '3.Confirm', isActive: false },
];

export const SpaceCreation = ({ orgId }) => {
  const [steps, setSteps] = useState(CREATE_SPACE_STEPS);
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
    }
  };

  // const navigateToPreviousStep = () => {
  //   const currentStepIndex = steps.indexOf(currentStep);
  //   const previousStep = steps[currentStepIndex - 1];

  //   if (previousStep) {
  //     navigateToStep(previousStep);
  //   }
  // };

  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<ProductIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumbs items={CREATE_SPACE_STEPS} />
          {steps.indexOf(currentStep) === 0 && (
            <SpacePlanStep orgId={orgId} navigateToNextStep={navigateToNextStep} />
          )}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};

SpaceCreation.propTypes = {
  orgId: PropTypes.string.isRequired,
};
