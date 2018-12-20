import React from 'react';
import PropTypes from 'prop-types';
import $state from '$state';
import $stateParams from '$stateParams';
import { getStore } from 'TheStore';
import { updateUserInSegment } from 'analytics/Analytics.es6';
import {
  getStoragePrefix,
  track
} from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';

const store = getStore();

export default class StackOnboardingSkip extends React.Component {
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
