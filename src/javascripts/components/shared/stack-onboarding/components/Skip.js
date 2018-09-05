import React from 'react';
import PropTypes from 'prop-types';
import { name as CreateModernOnboardingModule } from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'stack-onboarding-skip';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const $state = require('$state');
    const $stateParams = require('$stateParams');
    const store = require('TheStore').getStore();
    const { getStoragePrefix, track } = require(CreateModernOnboardingModule);
    const { updateUserInSegment } = require('analytics/Analytics.es6');

    class StackOnboardingSkip extends React.Component {
      static propTypes = {
        link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy'])
      };

      onClick = onboardingStepsComplete => {
        if (onboardingStepsComplete) {
          track(`close_from_${this.props.link}`);
        } else {
          track(`skip_from_${this.props.link}`);
          updateUserInSegment({
            onboardingSkipped: true
          });
        }
        $state.go('spaces.detail.home', {
          spaceId: $stateParams.spaceId
        });
      };

      render() {
        const onboardingStepsComplete = store.get(`${getStoragePrefix()}:completed`);

        return (
          <div
            onClick={() => this.onClick(onboardingStepsComplete)}
            className="modern-stack-onboarding--skip">
            {onboardingStepsComplete ? 'Close' : 'Skip >'}
          </div>
        );
      }
    }

    return StackOnboardingSkip;
  }
]);
