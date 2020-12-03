import { track } from 'analytics/Analytics';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

// these names should be kept up to date with event names defined in transform.js and Validator.js
export const EVENTS = {
  // Click Events
  FAIR_USAGE_POLICY: 'fair_use_policy_clicked',
  GET_IN_TOUCH: 'get_in_touch_clicked',
  HELP_LINK: 'help_link_clicked',
  TRIAL_TAG: 'trial_tag_clicked',
};

export const trackEvent = (eventName, data = {}) => () => {
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
