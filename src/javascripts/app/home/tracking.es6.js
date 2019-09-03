import { track } from 'analytics/Analytics.es6';
import { getCurrentStateName } from 'states/Navigator.es6';

const trackingGroupId = 'updated_admin_space_home';

export const trackClickCTA = elementId => {
  track('element:click', {
    elementId,
    groupId: trackingGroupId,
    fromState: getCurrentStateName()
  });
};
