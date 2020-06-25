import React from 'react';
import { getSubscriptionPlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { getVariation } from 'LaunchDarkly';
import { PRICING_2020_WARNING } from 'featureFlags';
import { SelfService, Free } from '../components/Pricing2020';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { createClientStorage } from 'core/services/BrowserStorage/ClientStorage';
import { track } from 'analytics/Analytics';
import { getCurrentOrg } from 'core/utils/getCurrentOrg';

export async function openPricing2020Warning() {
  const org = await getCurrentOrg();

  if (!(await shouldDisplay(org))) {
    return;
  }

  const endpoint = createOrganizationEndpoint(org.sys.id);

  const { items: plans } = await getSubscriptionPlans(endpoint);
  const spaces = await getAllSpaces(endpoint);

  const basePlan = plans.find((plan) => plan.planType === 'base');
  const spacePlans = plans.filter((plan) => plan.planType === 'space');
  // TODO: filter by search plan id instead
  const microPlans = spacePlans.filter((plan) => plan.name === 'Micro');
  const microSpaces = microPlans.map(
    (plan) => spaces.find((space) => space.sys.id === plan.gatekeeperKey)?.name
  );
  const freeSpace = spaces.find(
    (space) => !spacePlans.some((plan) => space.sys.id === plan.gatekeeperKey)
  )?.name;
  const isCommunity = basePlan.name === 'Community Platform';
  const isTeam = basePlan.name === 'Team';

  // TODO: return early if free space was created after the migration

  // if org has no free spaces, there's nothing to see
  if (!freeSpace) return;

  if (isCommunity || isTeam) {
    const key = getStorageKey(org.sys.id);
    const storage = createClientStorage('local');
    storage.set(key, 'true');
    track('pricing_update:communication_seen', { basePlanName: basePlan.name });
  }

  if (isCommunity) {
    ModalLauncher.open(({ isShown, onClose }) => <Free isShown={isShown} onClose={onClose} />);
  } else if (isTeam) {
    ModalLauncher.open(({ isShown, onClose }) => (
      <SelfService
        isShown={isShown}
        onClose={onClose}
        freeSpace={freeSpace}
        microSpaces={microSpaces}
      />
    ));
  }
}

async function shouldDisplay(org) {
  if (!org) return false;
  if (hasSeen(org.sys.id)) return false;

  const isEnabled = await getVariation(PRICING_2020_WARNING, { organizationId: org.sys.id });
  const isTargetUser = isOwnerOrAdmin(org);

  return isEnabled && isTargetUser;
}

function hasSeen(orgId) {
  const key = getStorageKey(orgId);
  const storage = createClientStorage('local');
  return storage.get(key);
}

function getStorageKey(orgId) {
  const storagePrefix = 'hasSeenPricing2020WarningForOrg';
  return `${storagePrefix}.${orgId}`;
}
