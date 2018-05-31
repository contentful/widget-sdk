import React from 'react';
import {name as DevNextStepsModule} from './DevNextSteps';
import {name as ResumeOnboardingModule} from './ResumeOnboarding';

const moduleName = 'ms-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);

    const onboardingStepsCompleteKey = `ctfl:${user.sys.id}:modernStackOnboarding:completed`;

    const DevNextSteps = require(DevNextStepsModule);
    const ResumeOnboarding = require(ResumeOnboardingModule);

    const DevNextStepsContainer = () => {
      const onboardingStepsComplete = store.get(onboardingStepsCompleteKey);

      return onboardingStepsComplete
        ? <DevNextSteps />
        : <ResumeOnboarding />;
    };

    return DevNextStepsContainer;
  }]);

export const name = moduleName;
