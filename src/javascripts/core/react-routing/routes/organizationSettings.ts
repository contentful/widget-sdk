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

/**
 * Organization Apps
 */

type OrganizationAppsListRouteType = {
  path: 'organizations.apps.list';
  orgId: string;
};

type OrganizationAppsNewDefinitionRouteType = {
  path: 'organizations.apps.new_definition';
  orgId: string;
};

type OrganizationAppsDefinitionRouteType = {
  path: 'organizations.apps.definition';
  orgId: string;
  definitionId: string;
  tab?: string;
};

const organizationAppsRoute = {
  'organizations.apps.list': (_, { orgId }: Omit<OrganizationAppsListRouteType, 'path'>) => ({
    path: 'account.organizations.apps',
    params: {
      pathname: '/',
      orgId,
    },
  }),
  'organizations.apps.new_definition': (
    _,
    { orgId }: Omit<OrganizationAppsNewDefinitionRouteType, 'path'>
  ) => ({
    path: 'account.organizations.apps',
    params: {
      pathname: '/new_definition',
      orgId,
    },
  }),
  'organizations.apps.definition': (
    _,
    { orgId, definitionId, tab = 'general' }: Omit<OrganizationAppsDefinitionRouteType, 'path'>
  ) => ({
    path: 'account.organizations.apps',
    params: {
      pathname: `/definitions/${definitionId}/${tab}`,
      orgId,
    },
  }),
};

/*
 * Invite users to organisation
 */

type OrganisationInvitationType = {
  path: 'organizations.users.invite';
  orgId: string;
};

const organisationInvitationRoute = {
  'organizations.users.invite': (_, { orgId }: Omit<OrganisationInvitationType, 'path'>) => ({
    path: 'account.organizations.users.new',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/**
 * Organization users
 */

type OrganizationMembershipsListType = {
  path: 'organizations.users.list';
  orgId: string;
};

const organizationMembershipsListRoute = {
  'organizations.users.list': (_, { orgId }: Omit<OrganizationMembershipsListType, 'path'>) => ({
    path: 'account.organizations.users.list',
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
  ...organizationsBillingRoute,
  ...organizationAccessToolsRoutes,
  ...organizationAppsRoute,
  ...organizationMembershipsListRoute,
  ...organisationInvitationRoute,
};

type OrganizationSettingsRouteType =
  | OrganizationUsageRouteType
  | OrganizationEditRouteType
  | OrganizationOffisiteBackupRouteType
  | OrganizationSubscriptionV1RouteType
  | OrganizationSubscriptionBillingRouteType
  | OrganizationSpacesRouteType
  | OrganizationsAccessToolsRouteType
  | OrganizationBillingRouteType
  | OrganizationBillingEditPaymentRouteType
  | OrganizationAppsListRouteType
  | OrganizationAppsNewDefinitionRouteType
  | OrganizationAppsDefinitionRouteType
  | OrganizationMembershipsListType
  | OrganisationInvitationType;

export type { OrganizationSettingsRouteType };

export { routes };
