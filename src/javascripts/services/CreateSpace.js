import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';

import { canCreateSpaceInOrganization } from 'access_control/AccessChecker';
import { getOrganization } from 'services/TokenStore';
import { router } from 'core/react-routing';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import {
  isEnterprisePlan,
  isSelfServicePlan,
  isFreePlan,
} from 'account/pricing/PricingDataProvider';
import { getVariation, FLAGS } from 'core/feature-flags';
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

  // if org is OnDemand or Free, they should go to /new_space
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);
  const spacePurchaseFlowAllowed = isSelfServicePlan(basePlan) || isFreePlan(basePlan);

  if (spacePurchaseFlowAllowed) {
    router.navigate({
      path: 'organizations.subscription.new_space',
      orgId: organizationId,
      navigationState: { ...customRouteParams },
    });
    return;
  }

  // if newSpaceCreationFlow flag is on and org is Enterprise, they should go to /space_create
  const isSpaceCreateForSpacePlanEnabled = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN);
  const hasEnterprisePlan = basePlan && isEnterprisePlan(basePlan);

  if (isSpaceCreateForSpacePlanEnabled && hasEnterprisePlan) {
    router.navigate({
      path: 'organizations.subscription.overview.create-space',
      orgId: organizationId,
    });
    return;
  }

  // other case, they should go to SpaceWizard
  ModalLauncher.open(({ isShown, onClose }) => (
    <SpaceWizardsWrapper isShown={isShown} onClose={onClose} organization={organization} />
  ));
}
