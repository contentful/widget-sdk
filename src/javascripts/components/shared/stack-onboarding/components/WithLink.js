import React from 'react';
import PropTypes from 'prop-types';
import {
  track,
  getStoragePrefix,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { updateUserInSegment } from 'analytics/Analytics';
import { getModule } from 'core/NgRegistry';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const store = getBrowserStorage();

export default class WithLink extends React.Component {
  static propTypes = {
    link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
    trackingElementId: PropTypes.string.isRequired,
    intercomKey: PropTypes.string,
    children: PropTypes.func.isRequired,
  };

  static contextType = SpaceEnvContext;

  render() {
    const { children, trackingElementId, intercomKey } = this.props;
    const getStateParams = () => {
      const { link } = this.props;
      const params = { spaceId: this.context.currentSpaceId };
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
      const $state = getModule('$state');

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

      await $state.go(path, params);
      // set current step after we have successfully transitioned to the new step
      if (path !== 'spaces.detail.home') {
        store.set(`${getStoragePrefix()}:currentStep`, { path, params });
      }
    };
    return children(move);
  }
}
