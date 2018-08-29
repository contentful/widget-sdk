import React from 'react';
import { name as DevNextStepsModule } from './DevNextSteps';
import { name as ResumeOnboardingModule } from './ResumeOnboarding';
import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'ms-dev-next-steps';

angular.module('contentful').factory(name, [
  'require',
  require => {
    const { getStoragePrefix, track } = require(CreateModernOnboardingModule);
    const store = require('TheStore').getStore();

    const DevNextSteps = require(DevNextStepsModule);
    const ResumeOnboarding = require(ResumeOnboardingModule);

    const DevNextStepsContainer = props => {
      const onboardingStepsComplete = store.get(`${getStoragePrefix()}:completed`);

      return onboardingStepsComplete ? (
        <DevNextSteps {...props} track={track} />
      ) : (
        <ResumeOnboarding track={track} />
      );
    };

    return DevNextStepsContainer;
  }
]);
