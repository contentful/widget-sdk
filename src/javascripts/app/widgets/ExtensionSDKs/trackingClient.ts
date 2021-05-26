import { TrackingClient } from '@contentful/experience-sdk';
import * as Analytics from 'analytics/Analytics';

export const trackingClient: TrackingClient = {
  initialize: () => Promise.resolve(),
  extensionSetValue: (data) => {
    Analytics.track('extension:set_value', data);
  },
};
