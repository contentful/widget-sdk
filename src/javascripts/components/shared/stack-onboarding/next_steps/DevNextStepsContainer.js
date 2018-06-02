import React from 'react';
import {name as DevNextStepsModule} from './DevNextSteps';
import {name as ResumeOnboardingModule} from './ResumeOnboarding';
import {name as CreateModernOnboarding} from '../../auto_create_new_space/CreateModernOnboarding';

const moduleName = 'ms-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const {track} = require(CreateModernOnboarding);
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);

    const onboardingStepsCompleteKey = `ctfl:${user.sys.id}:modernStackOnboarding:completed`;

    const DevNextSteps = require(DevNextStepsModule);
    const ResumeOnboarding = require(ResumeOnboardingModule);

    const DevNextStepsContainer = (props) => {
      const onboardingStepsComplete = store.get(onboardingStepsCompleteKey);

      return onboardingStepsComplete
        ? <DevNextSteps {...props} track={track} />
        : <ResumeOnboarding track={track} />;
    };

    return DevNextStepsContainer;
  }]);

export { moduleName as name };
