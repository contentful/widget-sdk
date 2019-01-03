import React from 'react';
import { getStore } from 'TheStore/index.es6';
import DevNextSteps from 'components/shared/stack-onboarding/next_steps/DevNextSteps.es6';
import ResumeOnboarding from 'components/shared/stack-onboarding/next_steps/ResumeOnboarding.es6';
import {
  getStoragePrefix,
  track
} from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';

const store = getStore();

const DevNextStepsContainer = props => {
  const onboardingStepsComplete = store.get(`${getStoragePrefix()}:completed`);

  return onboardingStepsComplete ? (
    <DevNextSteps {...props} track={track} />
  ) : (
    <ResumeOnboarding track={track} />
  );
};

export default DevNextStepsContainer;
