import { once } from 'lodash';
import * as Intercom from 'services/intercom';

const INTERCOM_PREFIX = 'feature-comments';

export function trackCommentCreated() {
  Intercom.trackEvent(`${INTERCOM_PREFIX}-comment-created`);
}

export const trackIsCommentsAlphaEligible = (() => {
  const track = once(() => Intercom.trackEvent(`${INTERCOM_PREFIX}-is-alpha-eligible`));
  return () => Intercom.isEnabled() && track();
})();
