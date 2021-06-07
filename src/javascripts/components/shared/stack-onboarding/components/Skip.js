import React from 'react';
import PropTypes from 'prop-types';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { updateUserInSegment } from 'analytics/Analytics';
import {
  getStoragePrefix,
  track,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { router } from 'core/react-routing';

const store = getBrowserStorage();

const StackOnboardingSkip = ({ link }) => {
  const onClick = (onboardingStepsComplete) => {
    if (onboardingStepsComplete) {
      track(`close_from_${link}`);
    } else {
      track(`skip_from_${link}`);
      updateUserInSegment({
        onboardingSkipped: true,
      });
    }

    router.navigate({ path: 'spaces.detail.home' });
  };
  const onboardingStepsComplete = store.get(`${getStoragePrefix()}:completed`);

  return (
    <div onClick={() => onClick(onboardingStepsComplete)} className="modern-stack-onboarding--skip">
      {onboardingStepsComplete ? 'Close' : 'Skip >'}
    </div>
  );
};

StackOnboardingSkip.propTypes = {
  link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy']),
};

export default StackOnboardingSkip;
