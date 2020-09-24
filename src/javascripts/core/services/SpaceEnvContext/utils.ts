import { SpaceEnv, Environment } from './types';

export function getSpaceData(space?: SpaceEnv) {
  return space?.data;
}

export function getSpaceEnforcements(space?: SpaceEnv) {
  return space?.enforcements ?? [];
}

export function getSpaceId(space?: SpaceEnv) {
  return getSpaceData(space)?.sys?.id;
}

export function getSpaceName(space?: SpaceEnv) {
  return getSpaceData(space)?.name;
}

export function getOrganization(space?: SpaceEnv) {
  return getSpaceData(space)?.organization;
}

export function getSpaceMember(space?: SpaceEnv) {
  return getSpaceData(space)?.spaceMember;
}

export function getSpaceRoles(space?: SpaceEnv) {
  return getSpaceMember(space)?.roles ?? [];
}

export function getOrganizationId(space?: SpaceEnv) {
  return getOrganization(space)?.sys.id;
}

export function getOrganizationName(space?: SpaceEnv) {
  return getOrganization(space)?.name;
}

export function isOrganizationBillable(space?: SpaceEnv) {
  return getOrganization(space)?.isBillable ?? false;
}

export function isAdmin(space?: SpaceEnv) {
  return getSpaceData(space)?.spaceMember.admin ?? false;
}

export function isSpaceReadyOnly(space?: SpaceEnv) {
  return !!getSpaceData(space)?.readOnlyAt ?? false;
}

export function isCurrentEnvironmentMaster(space?: SpaceEnv) {
  return space?.environmentMeta?.isMasterEnvironment ?? true;
}

export function isMasterEnvironment(environment?: Environment) {
  return !!(
    environment?.sys.id === 'master' ||
    environment?.sys.aliases?.find((alias) => alias.sys.id === 'master')
  );
}

export function isUnscopedRoute(space?: SpaceEnv) {
  return (
    space?.environmentMeta?.aliasId === 'master' ||
    space?.environmentMeta?.environmentId === 'master'
  );
}

export function getEnvironment(space?: SpaceEnv) {
  return space?.environment;
}

export function getEnvironmentId(space?: SpaceEnv) {
  return getEnvironment(space)?.sys.id;
}

export function getEnvironmentAliasId(space?: SpaceEnv): string | undefined {
  return space?.environmentMeta?.aliasId;
}

export function getEnvironmentName(space?: SpaceEnv) {
  return getEnvironment(space)?.name;
}

export function getSpaceVersion(space?: SpaceEnv) {
  return getSpaceData(space)?.sys.version;
}

export function getEnvironmentAliasesIds(environment?: Environment) {
  return environment?.sys.aliases?.map(({ sys }) => sys.id) ?? [];
}
