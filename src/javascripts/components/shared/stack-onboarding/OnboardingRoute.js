import React, { useEffect, useState } from 'react';
import { go } from 'states/Navigator';

import { LoadingState } from 'features/loading-state';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import { checkSpace } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';

const styles = {
  loaderWrapper: css({
    height: '100%',
  }),
};

const OnboardingRoute = ({ children }) => {
  const { currentSpaceId } = useSpaceEnvContext();
  const [isOnboardingSpace, setOnboardingSpace] = useState(false);
  useEffect(() => {
    if (!currentSpaceId) {
      return;
    }
    if (!checkSpace(currentSpaceId)) {
      go({ path: 'spaces.detail', params: { spaceId: currentSpaceId } });
    } else {
      setOnboardingSpace(true);
    }
  }, [currentSpaceId, setOnboardingSpace]);

  if (!currentSpaceId || !isOnboardingSpace) {
    return (
      <FullScreen>
        <Flex className={styles.loaderWrapper}>
          <LoadingState />
        </Flex>
      </FullScreen>
    );
  }
  return children;
};

export default OnboardingRoute;
