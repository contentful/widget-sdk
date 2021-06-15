import React from 'react';
import { getOrganization } from 'services/TokenStore';
import {
  open as openChangeSpaceWarningModal,
  MODAL_TYPES,
} from 'app/SpaceWizards/ChangeSpaceWarning';
import {
  isEnterprisePlan,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { getSpacePlanForSpace, getBasePlan } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';
import { router } from 'core/react-routing';

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
  if (!organizationId) {
    throw new Error('organizationId not supplied for space change');
  }
  if (!space) {
    throw new Error('space not supplied for space change');
  }

  const organization = await getOrganization(organizationId);
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const spacePlan = await getSpacePlanForSpace(orgEndpoint, space.sys.id);

  // if newSpacePurchase flag is on and org is OnDemand or Free, they should go to /new_space
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);
  const spacePurchaseFlowAllowedForPlanChange = isSelfServicePlan(basePlan) || isFreePlan(basePlan);

  if (isEnterprisePlan(spacePlan)) {
    openChangeSpaceWarningModal(MODAL_TYPES.COMMITTED);
  } else if (spacePurchaseFlowAllowedForPlanChange) {
    router.navigate({
      path: 'organizations.subscription.upgrade_space',
      orgId: organizationId,
      spaceId: space.sys.id,
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
