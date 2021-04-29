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

/**
 * Organization subscription billing
 */

type OrganizationBillingRouteType = {
  path: 'organizations.billing';
  orgId: string;
};

type OrganizationBillingEditPaymentRouteType = {
  path: 'organizations.billing.edit-payment-method';
  orgId: string;
};

const organizationsBillingRoute = {
  'organizations.billing': (_, { orgId }: Omit<OrganizationBillingRouteType, 'path'>) => ({
    path: 'account.organizations.billing',
    params: {
      pathname: '/',
      orgId,
    },
  }),
  'organizations.billing.edit-payment-method': (
    _,
    { orgId }: Omit<OrganizationBillingEditPaymentRouteType, 'path'>
  ) => ({
    path: 'account.organizations.billing',
    params: {
      pathname: '/edit_payment_method',
      orgId,
    },
  }),
};

/** Organization Access Tools */

type OrganizationAccessToolsUserProvisioningRouteType = {
  path: 'organizations.access-tools.user-provisioning';
  orgId: string;
};
type OrganizationsAccessToolsSSORouteType = {
  path: 'organizations.access-tools.sso';
  orgId: string;
};
type OrganizationsAccessToolsRouteType =
  | OrganizationAccessToolsUserProvisioningRouteType
  | OrganizationsAccessToolsSSORouteType;

const organizationAccessToolsRoutes = {
  'organizations.access-tools.user-provisioning': (
    _,
    { orgId }: Omit<OrganizationAccessToolsUserProvisioningRouteType, 'path'>
  ) => ({
    path: 'account.organizations.access-tools',
    params: {
      pathname: '/user_provisioning',
      orgId,
    },
  }),
  'organizations.access-tools.sso': (
    _,
    { orgId }: Omit<OrganizationsAccessToolsSSORouteType, 'path'>
  ) => ({
    path: 'account.organizations.access-tools',
    params: {
      pathname: '/sso',
      orgId,
    },
  }),
};

/** Organization subscription */

type OrganizationsNewSpaceRoute = {
  path: 'organizations.subscription.newSpace';
  orgId: string;
  navigationState?: {
    from?: string;
    preselect?: string;
    spaceId?: string;
  };
};

type OrganizationsSubscriptionRouteType = OrganizationsNewSpaceRoute;

const organizationsSubscriptionRoutes = {
  'organizations.subscription.newSpace': (
    _,
    { orgId, navigationState }: Omit<OrganizationsNewSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.new_space',
    params: {
      pathname: '/',
      orgId,
      navigationState,
    },
  }),
};

/** Exports */

const routes = {
  ...organizationsUsageRoute,
  ...organizationsEditRoute,
  ...organizationsOffisiteBackupRoute,
  ...organizationsSubscriptionV1Route,
  ...organizationsSubscriptionBillingRoute,
  ...organizationsSpacesRoute,
  ...organizationsBillingRoute,
  ...organizationsSubscriptionRoutes,
  ...organizationAccessToolsRoutes,
};

type OrganizationSettingsRouteType =
  | OrganizationUsageRouteType
  | OrganizationEditRouteType
  | OrganizationOffisiteBackupRouteType
  | OrganizationSubscriptionV1RouteType
  | OrganizationSubscriptionBillingRouteType
  | OrganizationSpacesRouteType
  | OrganizationsSubscriptionRouteType
  | OrganizationsAccessToolsRouteType
  | OrganizationBillingRouteType
  | OrganizationBillingEditPaymentRouteType;

export type { OrganizationSettingsRouteType };

export { routes };
