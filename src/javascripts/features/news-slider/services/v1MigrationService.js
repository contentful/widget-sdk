import React from 'react';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getVariation, FLAGS } from 'core/feature-flags';
import { GenericCustomerSlides } from '../components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { createClientStorage } from 'core/services/BrowserStorage/ClientStorage';
import { track } from 'analytics/Analytics';
import { getModule } from 'core/NgRegistry';
import { getOrganization, getSpace } from 'services/TokenStore';
import { getBasePlan } from 'features/pricing-entities';
import { isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { isPartnerPlan, isProBonoPlan } from 'account/pricing/PricingDataProvider';
import { generateBasePlanName } from 'features/organization-subscription';

const V1_DESTINATION_COMMUNITY = 'community';
const V1_DESTINATION_TEAM = 'team';
const V1_DESTINATION_PRO_BONO = 'pro_bono';
const V1_DESTINATION_PARTNER = 'partner';

async function getCurrentOrg() {
  const { orgId, spaceId } = getModule('$stateParams');

  if (orgId) {
    return getOrganization(orgId);
  } else if (spaceId) {
    const space = await getSpace(spaceId);
    return space.sys.organization;
  }

  // if the current page is not in the scope of any organization, return null.
  // i.e. Account settings and Home (for users without org access)
  return null;
}

export async function openV1MigrationWarning() {
  const org = await getCurrentOrg();
  if (!(await shouldDisplay(org))) {
    return;
  }

  const endpoint = createOrganizationEndpoint(org.sys.id);
  const basePlan = await getBasePlan(endpoint);
  const v1migrationDestination = org.sys?._v1Migration?.destination;

  const isCommunity = isFreePlan(basePlan) && v1migrationDestination === V1_DESTINATION_COMMUNITY;
  const isTeam = isSelfServicePlan(basePlan) && v1migrationDestination === V1_DESTINATION_TEAM;
  const isProBono = isProBonoPlan(basePlan) && v1migrationDestination === V1_DESTINATION_PRO_BONO;
  const isPartner = isPartnerPlan(basePlan) && v1migrationDestination === V1_DESTINATION_PARTNER;

  if (isCommunity || isTeam || isProBono || isPartner) {
    const key = getStorageKey(org.sys.id);
    const storage = createClientStorage('local');
    storage.set(key, 'true');
    track('v1_migration_update:communication_seen', { basePlanName: basePlan.name });
  }

  const basePlanName = generateBasePlanName(basePlan, v1migrationDestination);

  if (isCommunity || isTeam || isProBono || isPartner) {
    ModalLauncher.open(({ isShown, onClose }) => (
      <GenericCustomerSlides isShown={isShown} onClose={onClose} basePlanName={basePlanName} />
    ));
  }
}

async function shouldDisplay(org) {
  if (!org) {
    return false;
  }

  const isEnabled = await getVariation(FLAGS.V1_MIGRATION_2021_WARNING, {
    organizationId: org.sys.id,
  });

  if (!isEnabled || hasSeen(org.sys.id)) {
    return false;
  }

  // check for the status of the migration
  const v1migrationSucceeded = org?.sys?._v1Migration?.status === 'succeeded';
  const isTargetUser = isOwnerOrAdmin(org);

  return isTargetUser && v1migrationSucceeded;
}

function hasSeen(orgId) {
  const key = getStorageKey(orgId);
  const storage = createClientStorage('local');

  return storage.get(key);
}

function getStorageKey(orgId) {
  const storagePrefix = 'hasSeenV1MigrationWarning';
  return `${storagePrefix}.${orgId}`;
}
