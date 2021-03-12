import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';

import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { getModule } from 'core/NgRegistry';
import { getOrganization } from 'services/TokenStore';
import { go } from 'states/Navigator';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import LegacyNewSpaceModal from './CreateSpace/LegacyNewSpaceModal';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import {
  isEnterprisePlan,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getBasePlan } from 'features/pricing-entities';

import SpaceWizardsWrapper from 'app/SpaceWizards/SpaceWizardsWrapper';

/**
 * Starts the space creation flow.
 * The flow type will depend on the current organization.
 *
 * usage with customRouteParams:
 *
 * `beginAppsPurchase('my_org_id', { param: 'foo' })`
 *
 * this will result in the user going to
 * `/account/organizations/my_org_id/new_space?param=foo`
 *
 * @param {string} organizationId is the id of the current org (required);
 * @param {object?} customRouteParams are the params that will be passed to the purchase flow url;
 */
export async function beginSpaceCreation(organizationId, customRouteParams = {}) {
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

  // if org is OnDemand or Free, they should go to /new_space
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);
  const spacePurchaseFlowAllowed = isSelfServicePlan(basePlan) || isFreePlan(basePlan);

  if (spacePurchaseFlowAllowed) {
    go({
      path: ['account', 'organizations', 'subscription_new', 'new_space'],
      params: { orgId: organizationId, ...customRouteParams },
    });
    return;
  }

  // if newSpaceCreationFlow flag is on and org is Enterprise, they should go to /space_create
  const isSpaceCreateForSpacePlanEnabled = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN);
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
