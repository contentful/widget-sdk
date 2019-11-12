import { track } from 'analytics/Analytics';
import { getCurrentStateName } from 'states/Navigator';

const trackingGroupId = 'quick_navigation';

const trackOpenButtonClick = () => {
  track('element:click', {
    elementId: `open_quick_navigation_button`,
    groupId: trackingGroupId,
    fromState: getCurrentStateName()
  });
};

const trackClose = () => {
  track('element:click', {
    elementId: `close_quick_navigation`,
    groupId: trackingGroupId,
    fromState: getCurrentStateName()
  });
};

const trackOpenShortcut = () => {
  track('quick_navigation:opened_by_shortcut', {
    groupdId: trackingGroupId,
    fromState: getCurrentStateName()
  });
};

const trackSelectedItem = item => {
  let elementId, toState;
  if (item.type === 'search_link') {
    elementId = 'see_more_quick_navigation';
    toState = item.title;
  } else {
    elementId = 'go_quick_navigation';
    toState = item.type;
  }
  track('element:click', {
    elementId,
    groupId: trackingGroupId,
    fromState: getCurrentStateName(),
    toState
  });
};

export { trackOpenButtonClick, trackClose, trackOpenShortcut, trackSelectedItem };
