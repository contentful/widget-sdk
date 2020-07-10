import { without } from 'lodash';
import { validateEvent } from './Validator';
import { track } from './Analytics';
import { getCurrentStateName } from 'states/Navigator';

/**
 * Tracks if a targeted CTA is clicked.
 *
 * This is specifically for tracking a CTA that is shown to the user given a certain
 * condition, such as if the user sees a CTA when reaching their content types limit.
 * This shouldn't be used for CTAs that are "always" shown.
 *
 * An example event: targeted_cta_clicked:upgrade_to_enterprise
 *
 * @param  {string} intent The latter part of the event, e.g. upgrade_to_enterprise
 * @param  {object} meta Any additional metadata for this event, e.g. { organizationId, spaceId }
 */
export function trackCTAClick(intent, meta = {}) {
  const validMetaKeys = ['organizationId', 'spaceId'];

  if (!validateEvent(`targeted_cta_clicked:${intent}`)) {
    throw new Error(
      `${intent} is not a valid intent. Add it to the \`targeted_cta_clicked\` event validation`
    );
  }

  const invalidMetaKeys = without(Object.keys(meta), ...validMetaKeys);

  if (invalidMetaKeys.length > 0) {
    throw new Error(`Invalid keys in meta object: ${invalidMetaKeys.join(', ')}`);
  }

  track(`targeted_cta_clicked:${intent}`, {
    ctaLocation: getCurrentStateName(),
    meta,
  });
}
