import React from 'react';
import { getSubscriptionPlans } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { SelfService, Free } from '../components/Pricing2020';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { createClientStorage } from 'core/services/BrowserStorage/ClientStorage';
import { track } from 'analytics/Analytics';
import { getCurrentOrg } from 'core/utils/getCurrentOrg';

const MICRO_SPACE_NAME = 'Micro (Free)';
const COMMUNITY_BASE_PLAN_NAME = 'Community Platform';
const TEAM_BASE_PLAN_NAME = 'Team';
const RELEASE_DATE = new Date('2020-13-07');

export async function openPricing2020Warning() {
  const org = await getCurrentOrg();

  if (!(await shouldDisplay(org))) {
    return;
  }

  const endpoint = createOrganizationEndpoint(org.sys.id);

  let plans;
  let spaces;
  try {
    const result = await getSubscriptionPlans(endpoint);
    spaces = await getAllSpaces(endpoint);
    plans = result.items;
  } catch {
    return;
  }

  const basePlan = plans.find((plan) => plan.planType === 'base');
  const spacePlans = plans.filter((plan) => plan.planType === 'space');
  // TODO: filter by search plan id instead
  const microPlans = spacePlans.filter((plan) => plan.name === MICRO_SPACE_NAME);
  const microSpaceNames = microPlans
    .map((plan) => spaces.find((space) => space.sys.id === plan.gatekeeperKey)?.name)
    .filter(Boolean);
  const freeSpace = spaces.find(
    (space) => !spacePlans.some((plan) => space.sys.id === plan.gatekeeperKey)
  );
  const isCommunity = basePlan.name === COMMUNITY_BASE_PLAN_NAME;
  const isTeam = basePlan.name === TEAM_BASE_PLAN_NAME;

  // if org has no free spaces, there's nothing to see
  if (!freeSpace) return;

  const freeSpaceName = freeSpace.name;
  const freeSpaceCreationDate = new Date(freeSpace.sys.createdAt);

  // return early if the free space was created after the migration
  if (freeSpaceCreationDate > RELEASE_DATE) return;

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
        freeSpace={freeSpaceName}
        microSpaces={microSpaceNames}
      />
    ));
  }
}

async function shouldDisplay(org) {
  if (!org) return false;
  if (hasSeen(org.sys.id)) return false;

  const isEnabled = await getVariation(FLAGS.PRICING_2020_WARNING, { organizationId: org.sys.id });
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
