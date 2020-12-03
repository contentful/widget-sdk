import { track } from 'analytics/Analytics';
import { getCurrentStateName } from 'states/Navigator';

const trackingGroupId = 'updated_admin_space_home';

export const trackClickCTA = (elementId) => {
  track('element:click', {
    elementId,
    groupId: trackingGroupId,
    fromState: getCurrentStateName(),
  });
};
