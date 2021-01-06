import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { getModule } from 'core/NgRegistry';
import { getOrganization } from 'services/TokenStore';
import { go } from 'states/Navigator';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { isSpacePurchaseFlowAllowed } from 'features/space-purchase';
import LegacyNewSpaceModal from './CreateSpace/LegacyNewSpaceModal';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getBasePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getVariation, FLAGS } from 'LaunchDarkly';

import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';

/**
 * Displays the space creation dialog. The dialog type will depend on the
 * organization that the new space should belong to.
 *
 * Accepts one required parameter - `organizationId`;
 *
 * @param {string} organizationId
 */
export async function beginSpaceCreation(organizationId) {
  if (!organizationId) {
    throw new Error('organizationId not supplied for space creation');
  }

  const organization = await getOrganization(organizationId);

  // This should not happen as create space button must be hidden when user
  // has no rights to do it.
  // See https://contentful.tpondemand.com/entity/18031-user-without-create-space-permission-can
  if (!organization || !canCreateSpaceInOrganization(organizationId)) {
    Notification.error(
      'You don’t have rights to create a space, plase contact your organization’s administrator.'
    );
    return;
  }

  // if user is in a Legacy Org, they should go to LegacyWizard
  if (isLegacyOrganization(organization)) {
    const spaceContext = getModule('spaceContext');

    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <LegacyNewSpaceModal
          isShown={isShown}
          onClose={onClose}
          organization={organization}
          spaceContext={spaceContext}
        />
      );
    });
    return;
  }

  // if newSpacePurchase flag is on and org is OnDemand or Free, they should go to /new_space
  const spacePurchaseFlowAllowed = await isSpacePurchaseFlowAllowed(organizationId);

  if (spacePurchaseFlowAllowed) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'new_space'],
      params: { orgId: organizationId },
    });
    return;
  }

  // if newSpaceCreationFlow flag is on and org is Enterprise, they should go to /space_create
  const isSpaceCreateForSpacePlanEnabled = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN);
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);
  const hasEnterprisePlan = basePlan && isEnterprisePlan(basePlan);

  if (isSpaceCreateForSpacePlanEnabled && hasEnterprisePlan) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'overview', 'space_create'],
      params: { orgId: organizationId },
    });
    return;
  }

  // other case, they should go to SpaceWizard
  ModalLauncher.open(({ isShown, onClose }) => (
    <SpaceWizardsWrapper isShown={isShown} onClose={onClose} organization={organization} />
  ));
}
