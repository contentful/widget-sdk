import { TrackingClient } from '@contentful/experience-sdk';
import noop from 'lodash/noop';

export const trackingClient: TrackingClient = {
  initialize: () => Promise.resolve(),
  extensionSetValue: noop,
};
