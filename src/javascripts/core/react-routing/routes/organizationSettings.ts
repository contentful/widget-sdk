/**
 * Organization usage
 */

type OrganizationUsageRouteType = {
  path: 'organizations.usage';
};

const organizationsUsageRoute = {
  'organizations.usage': ({ orgId }: { orgId?: string }) => ({
    path: 'account.organizations.usage',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

const routes = {
  ...organizationsUsageRoute,
};

type OrganizationSettingsRouteType = OrganizationUsageRouteType;

export type { OrganizationSettingsRouteType };

export { routes };
