import { withQueryParams } from './withQueryParams';

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

type OrganizationsAccessToolsUserProvisioningRouteType = {
  path: 'organizations.access-tools.user-provisioning';
  orgId: string;
};
type OrganizationsAccessToolsSSORouteType = {
  path: 'organizations.access-tools.sso';
  orgId: string;
};
type OrganizationsAccessToolsRouteType =
  | OrganizationsAccessToolsUserProvisioningRouteType
  | OrganizationsAccessToolsSSORouteType;

const organizationsAccessToolsRoutes = {
  'organizations.access-tools.user-provisioning': (
    _,
    { orgId }: Omit<OrganizationsAccessToolsUserProvisioningRouteType, 'path'>
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

/** Organization Teams */

type OrganizationsTeamsListRouteType = {
  path: 'organizations.teams';
  orgId: string;
};
type OrganizationsTeamsDetailRouteType = {
  path: 'organizations.teams.detail';
  orgId: string;
  teamId: string;
};
type OrganizationsTeamsRouteType =
  | OrganizationsTeamsListRouteType
  | OrganizationsTeamsDetailRouteType;

const organizationsTeamsRoutes = {
  'organizations.teams': (_, { orgId }: Omit<OrganizationsTeamsListRouteType, 'path'>) => ({
    path: 'account.organizations.teams',
    params: {
      pathname: '/',
      orgId,
    },
  }),
  'organizations.teams.detail': (
    _,
    { orgId, teamId }: Omit<OrganizationsTeamsDetailRouteType, 'path'>
  ) => ({
    path: 'account.organizations.teams',
    params: {
      pathname: `/${teamId}`,
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
    path: 'account.organizations.invite',
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
    path: 'account.organizations.users',
    params: {
      pathname: '/',
      orgId,
    },
  }),
};

/** Organization subscription */

type OrganizationsSubscriptionNewSpaceRoute = {
  path: 'organizations.subscription.new_space';
  orgId: string;
  navigationState?: {
    from?: string;
    preselect?: string;
  };
};

type OrganizationsSubscriptionUpgradeSpaceRoute = {
  path: 'organizations.subscription.upgrade_space';
  orgId: string;
  spaceId: string;
  navigationState?: {
    from?: string;
    preselect?: string;
  };
};

type OrganizationsSubscriptionOverviewRoute = {
  path: 'organizations.subscription.overview';
  orgId: string;
};

type OrganizationsSubscriptionOverviewCreateSpaceRoute = {
  path: 'organizations.subscription.overview.create-space';
  orgId: string;
  planId?: string;
};

type OrganizationsSubscriptionOverviewSpacePlansRoute = {
  path: 'organizations.subscription.overview.space-plans';
  orgId: string;
  planId?: string;
  spaceId?: string;
};

type OrganizationsSubscriptionRouteType =
  | OrganizationsSubscriptionNewSpaceRoute
  | OrganizationsSubscriptionUpgradeSpaceRoute
  | OrganizationsSubscriptionOverviewRoute
  | OrganizationsSubscriptionOverviewCreateSpaceRoute
  | OrganizationsSubscriptionOverviewSpacePlansRoute;

const organizationsSubscriptionRoutes = {
  'organizations.subscription.new_space': (
    _,
    { orgId, navigationState }: Omit<OrganizationsSubscriptionNewSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.new_space',
    params: {
      pathname: '/',
      orgId,
      navigationState,
    },
  }),
  'organizations.subscription.upgrade_space': (
    _,
    { orgId, spaceId, navigationState }: Omit<OrganizationsSubscriptionUpgradeSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.upgrade_space',
    params: {
      pathname: `/${spaceId}`,
      orgId,
      navigationState,
    },
  }),
  'organizations.subscription.overview': (
    _,
    { orgId }: Omit<OrganizationsSubscriptionOverviewRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.overview',
    params: {
      pathname: '/',
      orgId,
    },
  }),
  'organizations.subscription.overview.create-space': (
    _,
    { orgId, planId }: Omit<OrganizationsSubscriptionOverviewCreateSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.overview',
    params: {
      pathname: withQueryParams('/space_create', { planId }),
      orgId,
    },
  }),
  'organizations.subscription.overview.space-plans': (
    _,
    { orgId, planId, spaceId }: Omit<OrganizationsSubscriptionOverviewSpacePlansRoute, 'path'>
  ) => ({
    path: 'account.organizations.subscription_new.overview',
    params: {
      pathname: withQueryParams(`/space_plans`, { planId, spaceId }),
      orgId,
    },
  }),
};

/**
 * Organization user details
 */

type OrganizationUserDetailsListType = {
  path: 'organizations.users.detail';
  orgId: string;
  userId: string;
};

const organizationUserDetailsRoute = {
  'organizations.users.detail': (
    _,
    { orgId, userId }: Omit<OrganizationUserDetailsListType, 'path'>
  ) => ({
    path: 'account.organizations.users',
    params: {
      pathname: `/${userId}`,
      orgId,
      userId,
    },
  }),
};

/**
 * New organization
 */

type NewOrganizationType = {
  path: 'account.new_organization';
};

const newOrganizationRoute = {
  'account.new_organization': () => ({
    path: 'account.new_organization',
    params: {
      pathname: `/`,
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
  ...organizationsAccessToolsRoutes,
  ...organizationsTeamsRoutes,
  ...organizationAppsRoute,
  ...organizationMembershipsListRoute,
  ...organisationInvitationRoute,
  ...organizationsSubscriptionRoutes,
  ...organizationUserDetailsRoute,
  ...newOrganizationRoute,
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
  | OrganizationsTeamsRouteType
  | OrganizationMembershipsListType
  | OrganisationInvitationType
  | OrganizationsSubscriptionRouteType
  | OrganizationUserDetailsListType
  | NewOrganizationType;

export type { OrganizationSettingsRouteType };

export { routes };
