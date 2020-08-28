import { SpaceEnv } from './types';

export function getSpaceData(space: SpaceEnv) {
  return space?.data ?? null;
}

export function getSpaceEnforcements(space: SpaceEnv) {
  return space?.enforcements ?? [];
}

export function getSpaceId(space: SpaceEnv) {
  return getSpaceData(space)?.sys?.id ?? null;
}

export function getSpaceName(space: SpaceEnv) {
  return getSpaceData(space)?.name ?? null;
}

export function getOrganization(space: SpaceEnv) {
  return getSpaceData(space)?.organization ?? null;
}

export function getSpaceRoles(space: SpaceEnv) {
  return getSpaceData(space)?.spaceMember.roles ?? null;
}

export function getOrganizationId(space: SpaceEnv) {
  return getOrganization(space)?.sys.id ?? null;
}

export function getOrganizationName(space: SpaceEnv) {
  return getOrganization(space)?.name ?? null;
}

export function isOrganizationBillable(space: SpaceEnv) {
  return getOrganization(space)?.isBillable ?? false;
}

export function isAdmin(space: SpaceEnv) {
  return getSpaceData(space)?.spaceMember.admin ?? false;
}

export function isSpaceReadyOnly(space: SpaceEnv) {
  return !!getSpaceData(space)?.readOnlyAt ?? false;
}

export function isCurrentEnvironmentMaster(space: SpaceEnv) {
  return space?.environmentMeta?.isMasterEnvironment ?? false;
}

export function getEnvironment(space: SpaceEnv) {
  return space?.environment ?? null;
}

export function getEnvironmentId(space: SpaceEnv) {
  return getEnvironment(space)?.sys.id ?? null;
}

export function getEnvironmentName(space: SpaceEnv) {
  return getEnvironment(space)?.name ?? null;
}
