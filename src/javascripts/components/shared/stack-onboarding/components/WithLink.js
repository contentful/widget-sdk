import React from 'react';
import PropTypes from 'prop-types';
import {
  track,
  getStoragePrefix
} from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { getStore } from 'browserStorage';
import { updateUserInSegment } from 'analytics/Analytics';
import { getModule } from 'NgRegistry';

const store = getStore();

export default class WithLink extends React.Component {
  static propTypes = {
    link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
    trackingElementId: PropTypes.string.isRequired,
    intercomKey: PropTypes.string,
    children: PropTypes.func.isRequired
  };

  render() {
    const spaceContext = getModule('spaceContext');
    const { children, trackingElementId, intercomKey } = this.props;
    const getStateParams = () => {
      const { link } = this.props;
      const spaceId = spaceContext.space && spaceContext.space.getId();
      const params = { spaceId };
      let path;

      if (link === 'spaceHome') {
        path = 'spaces.detail.home';
      } else {
        path = `spaces.detail.onboarding.${link}`;
      }

      return {
        path,
        params
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
          [intercomKey]: true
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
