import PropTypes from 'prop-types';
import {
  track,
  getStoragePrefix,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { updateUserInSegment } from 'analytics/Analytics';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { router } from 'core/react-routing';

const store = getBrowserStorage();

// export default class WithLink extends React.Component {
export default function WithLink({ link, trackingElementId, intercomKey, children }) {
  const { currentSpaceId } = useSpaceEnvContext();

  const getStateParams = () => {
    const params = { spaceId: currentSpaceId };
    let path;

    if (link === 'spaceHome') {
      path = 'spaces.detail.home';
    } else {
      path = `spaces.detail.onboarding.${link}`;
    }

    return {
      path,
      params,
    };
  };

  const move = async (_event, newTrackingElementId) => {
    const { path, params } = getStateParams();
    const elementId = newTrackingElementId || trackingElementId;

    if (elementId) {
      track(elementId);
    }

    if (intercomKey) {
      updateUserInSegment({
        [intercomKey]: true,
      });
    }

    // set current step after we have successfully transitioned to the new step
    if (path !== 'spaces.detail.home') {
      store.set(`${getStoragePrefix()}:currentStep`, { path, params });
    }
    router.navigate({ path, ...params });
  };

  return children(move);
}

WithLink.propTypes = {
  link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
  trackingElementId: PropTypes.string.isRequired,
  intercomKey: PropTypes.string,
  children: PropTypes.func.isRequired,
};
