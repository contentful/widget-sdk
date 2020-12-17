import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';

export function canUserCreatePaidSpace(organization) {
  return organization && (isOrgOwner(organization) || !!organization.isBillable);
}

export function canOrgCreateFreeSpace(freeSpaceResource) {
  return freeSpaceResource && !resourceIncludedLimitReached(freeSpaceResource);
}
