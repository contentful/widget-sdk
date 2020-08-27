export function getSpaceData(space) {
  return space?.data ?? null;
}

export function getSpaceEnforcements(space) {
  return space?.enforcements ?? [];
}

export function getSpaceId(space) {
  return getSpaceData(space)?.sys?.id ?? null;
}

export function getSpaceName(space) {
  return getSpaceData(space)?.name ?? null;
}

export function getOrganization(space) {
  return getSpaceData(space)?.organization ?? null;
}

export function getSpaceRoles(space) {
  return getSpaceData(space)?.spaceMember.roles ?? null;
}

export function getOrganizationId(space) {
  return getOrganization(space)?.sys.id ?? null;
}

export function getOrganizationName(space) {
  return getOrganization(space)?.name ?? null;
}

export function isOrganizationBillable(space) {
  return getOrganization(space)?.isBillable ?? false;
}

export function isAdmin(space) {
  return getSpaceData(space)?.spaceMember.admin ?? false;
}

export function isSpaceReadyOnly(space) {
  return !!getSpaceData(space)?.readOnlyAt ?? false;
}

export function isCurrentEnvironmentMaster(space) {
  return space?.environmentMeta?.isMasterEnvironment ?? false;
}

export function getEnvironment(space) {
  return space?.environment ?? null;
}

export function getEnvironmentId(space) {
  return getEnvironment(space)?.sys.id ?? null;
}

export function getEnvironmentName(space) {
  return getEnvironment(space)?.name ?? null;
}
