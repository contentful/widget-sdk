import { once } from 'lodash';
import * as Intercom from 'services/intercom.es6';

const INTERCOM_PREFIX = 'feature-tasks';

export function trackTaskCreated() {
  Intercom.trackEvent(`${INTERCOM_PREFIX}-task-created`);
}

export function trackTaskResolved() {
  Intercom.trackEvent(`${INTERCOM_PREFIX}-task-resolved`);
}

export const trackIsTasksAlphaEligible = (() => {
  const track = once(() => Intercom.trackEvent(`${INTERCOM_PREFIX}-is-alpha-eligible`));
  return () => Intercom.isEnabled() && track();
})();
