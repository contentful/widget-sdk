import { without } from 'lodash';
import { validateEvent } from './Validator';
import { track } from './Analytics';
import { getCurrentStateName } from 'states/Navigator';

const VALID_META_KEYS = ['organizationId', 'spaceId', 'ctaLocation'];

// Note these names should be kept up to date with same CTA_EVENTS in Validator.js, defined there to avoid
// circular dependency until a better solution for constants is determined.
export const CTA_EVENTS = {
  UPGRADE_TO_ENTERPRISE: 'upgrade_to_enterprise',
  UPGRADE_SPACE_PLAN: 'upgrade_space_plan',
  CREATE_SPACE: 'create_space',
  PURCHASE_MICRO_SMALL_VIA_SUPPORT: 'purchase_micro_small_via_support',
  UPGRADE_TO_TEAM: 'upgrade_to_team',
  REQUEST_TEAM_USER_LIMIT: 'increase_team_user_limit_via_support',
  ENTERPRISE_TRIAL_TAG: 'enterprise_trial_tag',
  TRIAL_SPACE_TAG: 'trial_space_tag',
  APP_TRIAL_TAG: 'app_trial_tag',
  PURCHASE_APP_VIA_TRIAL: 'purchase_app_via_trial',
  DELETE_APP_TRIAL_SPACE: 'delete_app_trial_space',
};

function ifValidThenTrack(action, intent, meta) {
  if (!validateEvent(`${action}:${intent}`)) {
    throw new Error(
      `${intent} is not a valid intent. Add it to the \`targeted_cta_clicked\` event validation`
    );
  }

  const invalidMetaKeys = without(Object.keys(meta), ...VALID_META_KEYS);

  if (invalidMetaKeys.length > 0) {
    throw new Error(`Invalid keys in meta object: ${invalidMetaKeys.join(', ')}`);
  }

  track(`${action}:${intent}`, {
    // ctaLocation should only be overriden from the default getCurrentStateName() for ctas that are state independent.
    // For example ctas in the Navbar and it's children like the Sidepanel.
    ctaLocation: meta.ctaLocation ?? getCurrentStateName(),
    ctaLocationType: meta.ctaLocation ? 'other' : 'ui_state',
    meta,
  });
}

/**
 * Tracks if a CTA is clicked.
 *
 * This is specifically for tracking a CTA is "always" shown.
 *
 * An example event: cta_clicked:upgrade_to_enterprise
 *
 * @param  {string} intent The latter part of the event, e.g. upgrade_to_enterprise
 * @param  {object} meta Any additional metadata for this event, e.g. { organizationId, spaceId }
 */

export function trackCTAClick(intent, meta = {}) {
  ifValidThenTrack('cta_clicked', intent, meta);
}

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

export function trackTargetedCTAClick(intent, meta = {}) {
  ifValidThenTrack('targeted_cta_clicked', intent, meta);
}

/**
 * Tracks if a targeted CTA is shown.
 *
 * This is specifically for tracking that a CTA has been rendered given a certain
 * condition, such as if the user sees a CTA only when reaching their content types limit.
 * This shouldn't be used for CTAs that are "always" shown.
 *
 * An example event: targeted_cta_impression:upgrade_to_enterprise
 *
 * @param  {string} intent The latter part of the event, e.g. upgrade_to_enterprise
 * @param  {object} meta Any additional metadata for this event, e.g. { organizationId, spaceId }
 */
export function trackTargetedCTAImpression(intent, meta = {}) {
  ifValidThenTrack('targeted_cta_impression', intent, meta);
}
