import {
  SpaceEnv,
  Environment,
  SpaceData,
  Enforcements,
  Organization,
  SpaceMember,
  Role,
  EnvironmentMeta,
} from './types';

export function getSpaceData(space?: SpaceEnv): SpaceData | undefined {
  return space?.data;
}

export function getSpaceEnforcements(space?: SpaceEnv): Enforcements[] {
  return space?.enforcements ?? [];
}

export function getSpaceId(space?: SpaceEnv): string | undefined {
  return getSpaceData(space)?.sys?.id;
}

export function getSpaceName(space?: SpaceEnv): string | undefined {
  return getSpaceData(space)?.name;
}

export function getOrganization(space?: SpaceEnv): Organization | undefined {
  return getSpaceData(space)?.organization;
}

export function getSpaceMember(space?: SpaceEnv): SpaceMember | undefined {
  return getSpaceData(space)?.spaceMember;
}

export function getSpaceRoles(space?: SpaceEnv): Role[] {
  return getSpaceMember(space)?.roles ?? [];
}

export function getOrganizationId(space?: SpaceEnv): string | undefined {
  return getOrganization(space)?.sys.id;
}

export function getOrganizationName(space?: SpaceEnv): string | undefined {
  return getOrganization(space)?.name;
}

export function getEnvironmentMeta(space?: SpaceEnv): EnvironmentMeta | undefined {
  return space?.environmentMeta;
}

export function isOrganizationBillable(space?: SpaceEnv): boolean {
  return getOrganization(space)?.isBillable ?? false;
}

export function isAdmin(space?: SpaceEnv): boolean {
  return getSpaceData(space)?.spaceMember.admin ?? false;
}

export function isSpaceReadyOnly(space?: SpaceEnv): boolean {
  return !!getSpaceData(space)?.readOnlyAt ?? false;
}

export function isCurrentEnvironmentMaster(space?: SpaceEnv): boolean {
  return space?.environmentMeta?.isMasterEnvironment ?? true;
}

export function isMasterEnvironment(environment?: Environment): boolean {
  if (
    environment?.sys.id === 'master' ||
    environment?.sys.aliases?.find((alias) => alias.sys.id === 'master')
  ) {
    return true;
  }
  return false;
}

export function isMasterEnvironmentById(environments: Environment[], envId) {
  const envOrAlias = environments.find((env) => env.sys.id === envId);
  return isMasterEnvironment(envOrAlias);
}

export function isUnscopedRoute(space?: SpaceEnv): boolean {
  return (
    space?.environmentMeta?.aliasId === 'master' ||
    space?.environmentMeta?.environmentId === 'master'
  );
}

export function getEnvironment(space?: SpaceEnv): Environment | undefined {
  return space?.environment;
}

export function getEnvironmentId(space?: SpaceEnv): string {
  return getEnvironment(space)?.sys.id ?? 'master';
}

export function getEnvironmentAliasId(space?: SpaceEnv): string | undefined {
  return space?.environmentMeta?.aliasId;
}

export function getEnvironmentName(space?: SpaceEnv): string | undefined {
  return getEnvironment(space)?.name;
}

export function getSpaceVersion(space?: SpaceEnv): number | undefined {
  return getSpaceData(space)?.sys.version;
}

export function getEnvironmentAliasesIds(environment?: Environment): string[] {
  return environment?.sys.aliases?.map(({ sys }) => sys.id) ?? [];
}

export function hasOptedIntoAliases(environments?: Environment[]): boolean | undefined {
  return environments?.some(({ sys: { aliases = [] } }) => aliases.length > 0);
}
