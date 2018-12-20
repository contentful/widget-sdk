import React from 'react';
import PropTypes from 'prop-types';
import $state from '$state';
import spaceContext from 'spaceContext';
import {
  track,
  getStoragePrefix
} from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';
import { getStore } from 'TheStore';
import { updateUserInSegment } from 'analytics/Analytics.es6';

const store = getStore();

export default class WithLink extends React.Component {
  static propTypes = {
    link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
    trackingElementId: PropTypes.string.isRequired,
    intercomKey: PropTypes.string,
    children: PropTypes.func.isRequired
  };

  render() {
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
      store.set(`${getStoragePrefix()}:currentStep`, { path, params });
    };
    return children(move);
  }
}
