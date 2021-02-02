import type { Organization } from 'core/services/SpaceEnvContext/types';
import type { FreeSpaceResource } from '../types';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';

export function canUserCreatePaidSpace(organization?: Organization): boolean {
  return !!organization && (isOrgOwner(organization) || !!organization.isBillable);
}

export function canOrgCreateFreeSpace(freeSpaceResource?: FreeSpaceResource): boolean {
  return !!freeSpaceResource && !resourceIncludedLimitReached(freeSpaceResource);
}
