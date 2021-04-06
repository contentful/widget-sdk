import { track } from 'analytics/Analytics';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { getCurrentStateName } from 'states/Navigator';

// these names should be kept up to date with event names defined in transform.js and Validator.js

export const EVENTS = {
  APP_TRIAL_STARTED: 'app_trial_started',
  // Click events
  FAIR_USAGE_POLICY: 'fair_use_policy_clicked',
  GET_IN_TOUCH: 'get_in_touch_clicked',
  HELP_LINK: 'help_link_clicked',
  TRIAL_TAG: 'trial_tag_clicked',
  APP_TRIAL_START: 'app_trial_start_clicked',
  // Performance events
  APP_TRIAL_PERFORMANCE: 'app_trial_start_performance',
} as const;

export const trackEvent = (eventName: typeof EVENTS[keyof typeof EVENTS], data: any = {}) => {
  if (!data.from) {
    data.fromState = getCurrentStateName();
  }
  track(`trial:${eventName}`, data);
};

export const withInAppHelpUtmParamsSpaceHome = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'space-trial-home',
  campaign: 'in-app-help',
});

export const withInAppHelpUtmParamsSubscription = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'subscription-enterprise-trial',
  campaign: 'in-app-help',
});
