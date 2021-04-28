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
 * Organization edit
 */

type OrganizationEditRouteType = {
  path: 'organizations.edit';
  orgId: string;
};

const organizationsEditRoute = {
  'organizations.edit': (_, { orgId }: Omit<OrganizationEditRouteType, 'path'>) => ({
    path: 'account.organizations.edit',
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

/**
 * Organization offsite backup
 */

type OrganizationOffisiteBackupRouteType = {
  path: 'organizations.offsitebackup';
  orgId: string;
};

const organizationsOffisiteBackupRoute = {
  'organizations.offsitebackup': (
    _,
    { orgId }: Omit<OrganizationOffisiteBackupRouteType, 'path'>
  ) => ({
    path: 'account.organizations.offsitebackup',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/**
 * Organization subscription V1
 */

type OrganizationSubscriptionV1RouteType = {
  path: 'organizations.subscription_v1';
  orgId: string;
};

const organizationsSubscriptionV1Route = {
  'organizations.subscription_v1': (
    _,
    { orgId }: Omit<OrganizationSubscriptionV1RouteType, 'path'>
  ) => ({
    path: 'account.organizations.subscription',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/**
 * Organization subscription billing
 */

type OrganizationSubscriptionBillingRouteType = {
  path: 'organizations.subscription_billing';
  orgId: string;
};

const organizationsSubscriptionBillingRoute = {
  'organizations.subscription_billing': (
    _,
    { orgId }: Omit<OrganizationSubscriptionBillingRouteType, 'path'>
  ) => ({
    path: 'account.organizations.subscription_billing',
    params: {
      pathname: '/billing_address',
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
  ...organizationsEditRoute,
  ...organizationsOffisiteBackupRoute,
  ...organizationsSubscriptionV1Route,
  ...organizationsSubscriptionBillingRoute,
  ...organizationsSpacesRoute,
  ...organizationUserProvisioning,
};

type OrganizationSettingsRouteType =
  | OrganizationUsageRouteType
  | OrganizationEditRouteType
  | OrganizationOffisiteBackupRouteType
  | OrganizationSubscriptionV1RouteType
  | OrganizationSubscriptionBillingRouteType
  | OrganizationSpacesRouteType
  | OrganizationUserProvisioningRouteType;

export type { OrganizationSettingsRouteType };

export { routes };
