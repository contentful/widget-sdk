import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'stack-onboarding-skip';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $state = require('$state');
  const $stateParams = require('$stateParams');
  const { track } = require(CreateModernOnboardingModule);
  const store = require('TheStore').getStore();
  const {user$} = require('services/TokenStore');
  const {getValue} = require('utils/kefir');

  const user = getValue(user$);
  const onboardingStepsCompleteKey = `ctfl:${user.sys.id}:modernStackOnboarding:completed`;

  const StackOnboardingSkip = createReactClass({
    onClick () {
      $state.go('spaces.detail.home', {
        spaceId: $stateParams.spaceId
      });
    },
    render () {
      const onboardingStepsComplete = store.get(onboardingStepsCompleteKey);

      return (
        <div onClick={this.onClick} className='modern-stack-onboarding--skip'>
          {onboardingStepsComplete ? 'Close' : 'Skip >'}
        </div>
      );
    }
  });

  return StackOnboardingSkip;
}]);
