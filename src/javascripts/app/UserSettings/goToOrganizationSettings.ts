import { isDeveloper, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isOrganizationOnTrial } from 'features/trials';
import * as TokenStore from 'services/TokenStore';
import { router } from 'core/react-routing';

export async function goToOrganizationSettings(orgId: string) {
  const organization = await TokenStore.getOrganization(orgId);

  if (isDeveloper(organization)) {
    router.navigate(
      { path: 'organizations.apps.list', orgId: organization.sys.id },
      { location: 'replace' }
    );
  } else if (isOwnerOrAdmin(organization) || isOrganizationOnTrial(organization)) {
    router.navigate(
      { path: 'organizations.subscription.overview', orgId: organization.sys.id },
      { location: 'replace' }
    );
  } else {
    // They are a member and the member path should go to organization/teams
    router.navigate(
      { path: 'organizations.teams', orgId: organization.sys.id },
      { location: 'replace' }
    );
  }
}
