import React from 'react';
import PropTypes from 'prop-types';
import { getStore } from 'TheStore';
import { updateUserInSegment } from 'analytics/Analytics';
import {
  getStoragePrefix,
  track
} from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { getModule } from 'NgRegistry';

const store = getStore();

export default class StackOnboardingSkip extends React.Component {
  static propTypes = {
    link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy'])
  };

  onClick = onboardingStepsComplete => {
    const $state = getModule('$state');
    const $stateParams = getModule('$stateParams');

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
