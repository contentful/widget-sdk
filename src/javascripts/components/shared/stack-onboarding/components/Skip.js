import React from 'react';
import createReactClass from 'create-react-class';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'stack-onboarding-skip';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $state = require('$state');
  const $stateParams = require('$stateParams');
  const { track } = require(CreateModernOnboardingModule);
  const store = require('TheStore').getStore();
  const {getStoragePrefix} = require(CreateModernOnboardingModule);

  const StackOnboardingSkip = createReactClass({
    onClick () {
      $state.go('spaces.detail.home', {
        spaceId: $stateParams.spaceId
      });
    },
    render () {
      const onboardingStepsComplete = store.get(`${getStoragePrefix()}:completed`);

      return (
        <div onClick={this.onClick} className='modern-stack-onboarding--skip'>
          {onboardingStepsComplete ? 'Close' : 'Skip >'}
        </div>
      );
    }
  });

  return StackOnboardingSkip;
}]);
