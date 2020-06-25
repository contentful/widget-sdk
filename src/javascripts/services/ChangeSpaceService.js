import React from 'react';
import { getOrganization } from 'services/TokenStore';
import {
  open as openChangeSpaceWarningModal,
  MODAL_TYPES,
} from 'app/SpaceWizards/ChangeSpaceWarning';
import { getCurrentStateName } from 'states/Navigator';
import * as Analytics from 'analytics/Analytics';
import { getSingleSpacePlan, isPOCSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ModalLauncher } from 'core/components/ModalLauncher';
import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';

/**
 * Tracks if a targeted CTA is clicked.
 *
 * This is specifically for tracking a CTA that is shown to the user given a certain
 * condition, such as if the user sees a CTA when reaching their content types limit,
 * but not for actions/CTAs that are always shown, like the `upgrade` link on the
 * subscription page.
 *
 * @param  {string} organizationId
 * @param  {string} spaceId
 */
export function trackCTAClick(organizationId, spaceId) {
  Analytics.track('upgrade_plan_link:targeted_cta_clicked', {
    ctaLocation: getCurrentStateName(),
    organizationId,
    spaceId,
  });
}

/**
 * Creates a string to be passed to the notification
 *
 * @param {object} space - space that's been upgraded
 * @param {object} currentSpacePlan - the space's previous plan
 * @param {object} newSpacePlan - the space's new plan
 */
export const getNotificationMessage = (space, currentSpacePlan, newSpacePlan) => {
  let notificationMsg = `Space ${space.name} successfully`;

  if (currentSpacePlan) {
    const changeType = newSpacePlan.price >= currentSpacePlan.price ? 'upgraded' : 'downgraded';
    notificationMsg = `${notificationMsg} ${changeType} to a ${newSpacePlan.name} space.`;
  } else {
    notificationMsg = `${notificationMsg} changed.`;
  }

  return notificationMsg;
};

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * @param {string} organizationId
 * @param {object?} space - optional space to upgrade
 * @param {function} onSubmit
 */
export async function showDialog({ organizationId, space, onSubmit: onSuccess }) {
  // onSubmit is aliased to onSuccess because it's actually fired once the modal is successful, not every time.
  // Will be updated in a later PR.

  if (!organizationId) {
    throw new Error('organizationId not supplied for space change');
  }

  const organization = await getOrganization(organizationId);

  if (!space) {
    throw new Error('space not supplied for space change');
  }

  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const spacePlan = await getSingleSpacePlan(orgEndpoint, space.sys.id);

  if (spacePlan && spacePlan.committed) {
    openChangeSpaceWarningModal(MODAL_TYPES.COMMITTED);
  } else if (isPOCSpacePlan(spacePlan)) {
    openChangeSpaceWarningModal(MODAL_TYPES.POC);
  } else {
    const result = await ModalLauncher.open(({ isShown, onClose }) => (
      <SpaceWizardsWrapper
        isShown={isShown}
        onClose={onClose}
        organization={organization}
        space={space}
      />
    ));

    if (result) {
      onSuccess && onSuccess(result);
    }
  }
}
