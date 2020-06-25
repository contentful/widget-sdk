import { getModule } from 'core/NgRegistry';
import { getOrganization, getSpace } from 'services/TokenStore';

export async function getCurrentOrg() {
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
