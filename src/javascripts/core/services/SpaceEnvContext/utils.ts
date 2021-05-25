import { EnvironmentProps as Environment } from 'contentful-management/types';
import { SpaceObject } from 'classes/spaceContextTypes';

export function getSpaceData(space?: SpaceObject) {
  return space?.data;
}

export function getSpaceEnforcements(space?: SpaceObject) {
  return space?.enforcements ?? [];
}

export function getSpaceId(space?: SpaceObject) {
  return getSpaceData(space)?.sys?.id;
}

export function getSpaceName(space?: SpaceObject) {
  return getSpaceData(space)?.name;
}

export function getOrganization(space?: SpaceObject) {
  return getSpaceData(space)?.organization;
}

export function getSpaceMember(space?: SpaceObject) {
  return getSpaceData(space)?.spaceMember;
}

export function getSpaceRoles(space?: SpaceObject) {
  return getSpaceMember(space)?.roles ?? [];
}

export function getOrganizationId(space?: SpaceObject) {
  return getOrganization(space)?.sys.id;
}

export function getOrganizationName(space?: SpaceObject) {
  return getOrganization(space)?.name;
}

export function getEnvironmentMeta(space?: SpaceObject) {
  return space?.environmentMeta;
}

export function isOrganizationBillable(space?: SpaceObject): boolean {
  return getOrganization(space)?.isBillable ?? false;
}

export function isAdmin(space?: SpaceObject): boolean {
  return getSpaceData(space)?.spaceMember.admin ?? false;
}

export function isSpaceReadyOnly(space?: SpaceObject): boolean {
  return !!getSpaceData(space)?.readOnlyAt ?? false;
}

export function isCurrentEnvironmentMaster(space?: SpaceObject): boolean {
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

export function getEnvironment(space?: SpaceObject): Environment | undefined {
  return space?.environment;
}

export function getEnvironmentId(space?: SpaceObject): string {
  return getEnvironment(space)?.sys.id ?? 'master';
}

export function getEnvironmentAliasId(space?: SpaceObject): string | undefined {
  return space?.environmentMeta?.aliasId;
}

export function getEnvironmentName(space?: SpaceObject): string | undefined {
  return getEnvironment(space)?.name;
}

export function getSpaceVersion(space?: SpaceObject): number | undefined {
  return getSpaceData(space)?.sys.version;
}

export function getEnvironmentAliasesIds(environment?: Environment): string[] {
  return environment?.sys.aliases?.map(({ sys }) => sys.id) ?? [];
}

export function hasOptedIntoAliases(environments?: Environment[]): boolean | undefined {
  return environments?.some(({ sys: { aliases = [] } }) => aliases.length > 0);
}
