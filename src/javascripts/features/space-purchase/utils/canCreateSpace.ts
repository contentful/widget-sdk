import type { Organization } from 'core/services/SpaceEnvContext/types';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';

// TODO: we should have a more generic interface
interface FreeSpaceResource {
  limits: { included: number; maximum: number };
  name: 'Free space';
  parent?: unknown;
  period?: unknown;
  sys: {
    id: 'free_space';
    type: 'OrganizationResource';
  };
  unitOfMeasure?: unknown;
  usage: number;
}

export function canUserCreatePaidSpace(organization?: Organization): boolean {
  return !!organization && (isOrgOwner(organization) || !!organization.isBillable);
}

export function canOrgCreateFreeSpace(freeSpaceResource?: FreeSpaceResource): boolean {
  return !!freeSpaceResource && !resourceIncludedLimitReached(freeSpaceResource);
}
