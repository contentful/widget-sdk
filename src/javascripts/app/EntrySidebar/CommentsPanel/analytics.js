import * as Intercom from 'services/intercom';

const INTERCOM_PREFIX = 'feature-comments';

export function trackCommentCreated() {
  Intercom.trackEvent(`${INTERCOM_PREFIX}-comment-created`);
}
