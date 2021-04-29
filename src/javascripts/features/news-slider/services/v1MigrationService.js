import React from 'react';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { CommunitySlides, TeamSlides } from '../components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { createClientStorage } from 'core/services/BrowserStorage/ClientStorage';
import { track } from 'analytics/Analytics';
import { getModule } from 'core/NgRegistry';
import { getOrganization, getSpace } from 'services/TokenStore';
import { getBasePlan } from 'features/pricing-entities';

const COMMUNITY_BASE_PLAN_NAME = 'Community Platform';
const TEAM_BASE_PLAN_NAME = 'Team';

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
  const isCommunity = basePlan.name === COMMUNITY_BASE_PLAN_NAME; // TODO and check the additional v1 indicator
  const isTeam = basePlan.name === TEAM_BASE_PLAN_NAME; // TODO and check the additional v1 indicator

  if (isCommunity || isTeam) {
    const key = getStorageKey(org.sys.id);
    const storage = createClientStorage('local');
    storage.set(key, 'true');
    track('v1_migration_update:communication_seen', { basePlanName: basePlan.name });
  }

  if (isCommunity) {
    ModalLauncher.open(({ isShown, onClose }) => (
      <CommunitySlides isShown={isShown} onClose={onClose} />
    ));
  } else if (isTeam) {
    ModalLauncher.open(({ isShown, onClose }) => (
      <TeamSlides isShown={isShown} onClose={onClose} />
    ));
  }
}

async function shouldDisplay(org) {
  if (!org) return false;

  if (hasSeen(org.sys.id)) return false;
  const isEnabled = await getVariation(FLAGS.V1_MIGRATION_2021_WARNING, {
    organizationId: org.sys.id,
  });
  const isTargetUser = isOwnerOrAdmin(org);

  return isEnabled && isTargetUser;
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
