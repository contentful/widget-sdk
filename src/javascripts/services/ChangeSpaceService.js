import React from 'react';
import { getOrganization } from 'services/TokenStore';
import {
  open as openChangeSpaceWarningModal,
  MODAL_TYPES,
} from 'app/SpaceWizards/ChangeSpaceWarning';
import { getSingleSpacePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';
import { go } from 'states/Navigator';
import { isSpacePurchaseFlowAllowedForChange } from 'features/space-purchase';
import { FLAGS, getVariation } from 'LaunchDarkly';

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
export async function beginSpaceChange({ organizationId, space, onSubmit: onModalSuccess }) {
  if (!organizationId) throw new Error('organizationId not supplied for space change');
  if (!space) throw new Error('space not supplied for space change');

  const organization = await getOrganization(organizationId);
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const spacePlan = await getSingleSpacePlan(orgEndpoint, space.sys.id);

  // if newSpacePurchase flag is on and org is OnDemand or Free, they should go to /new_space
  const spacePurchaseFlowAllowedForPlanChange = await isSpacePurchaseFlowAllowedForChange(
    organizationId
  );

  const isEnterpriseSpaceChangeAllowed = await getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT, {
    organizationId,
  });

  if (isEnterpriseSpaceChangeAllowed && isEnterprisePlan(spacePlan)) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'overview', 'space_plans'],
      params: { orgId: organizationId, spaceId: space.sys.id },
    });
  } else if (isEnterprisePlan(spacePlan)) {
    openChangeSpaceWarningModal(MODAL_TYPES.COMMITTED);
  } else if (spacePurchaseFlowAllowedForPlanChange) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'upgrade_space'],
      params: { orgId: organizationId, spaceId: space.sys.id },
    });
    return;
  } else {
    const modalSuccess = await ModalLauncher.open(({ isShown, onClose }) => (
      <SpaceWizardsWrapper
        isShown={isShown}
        onClose={onClose}
        organization={organization}
        space={space}
      />
    ));

    if (modalSuccess) {
      onModalSuccess(modalSuccess);
    }
  }
}
