/**
 * Organization usage
 */

type OrganizationUsageRouteType = {
  path: 'organizations.usage';
  orgId: string;
};

const organizationsUsageRoute = {
  'organizations.usage': (_, { orgId }: Omit<OrganizationUsageRouteType, 'path'>) => ({
    path: 'account.organizations.usage',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/**
 * Organization spaces
 */

type OrganizationSpacesRouteType = {
  path: 'organizations.spaces';
  orgId: string;
};

const organizationsSpacesRoute = {
  'organizations.spaces': (_, { orgId }: Omit<OrganizationSpacesRouteType, 'path'>) => ({
    path: 'account.organizations.spaces',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/** Organization Access Tools */

type OrganizationUserProvisioningRouteType = {
  path: 'organizations.userProvisioning';
  orgId: string;
};

const organizationUserProvisioning = {
  'organizations.userProvisioning': (
    _,
    { orgId }: Omit<OrganizationUserProvisioningRouteType, 'path'>
  ) => ({
    path: 'account.organizations.access-tools.user-provisioning',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

const routes = {
  ...organizationsUsageRoute,
  ...organizationsSpacesRoute,
  ...organizationUserProvisioning,
};

type OrganizationSettingsRouteType =
  | OrganizationUsageRouteType
  | OrganizationSpacesRouteType
  | OrganizationUserProvisioningRouteType;

export type { OrganizationSettingsRouteType };

export { routes };
