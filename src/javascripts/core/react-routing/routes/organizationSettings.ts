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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/usage`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/edit`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/offsite_backup/edit`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/z_subscription`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/subscription/billing_address`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/billing`,
    },
  }),
  'organizations.billing.edit-payment-method': (
    _,
    { orgId }: Omit<OrganizationBillingEditPaymentRouteType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/billing/edit_payment_method`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/access_tools/user_provisioning`,
      orgId,
    },
  }),
  'organizations.access-tools.sso': (
    _,
    { orgId }: Omit<OrganizationsAccessToolsSSORouteType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/access_tools/sso`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/teams`,
    },
  }),
  'organizations.teams.detail': (
    _,
    { orgId, teamId }: Omit<OrganizationsTeamsDetailRouteType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/teams/${teamId}`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/apps`,
    },
  }),
  'organizations.apps.new_definition': (
    _,
    { orgId }: Omit<OrganizationAppsNewDefinitionRouteType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/apps/new_definition`,
    },
  }),
  'organizations.apps.definition': (
    _,
    { orgId, definitionId, tab = 'general' }: Omit<OrganizationAppsDefinitionRouteType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/apps/definitions/${definitionId}/${tab}`,
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/invite`,
    },
  }),
};

/**
 * Organization users
 */

type OrganizationMembershipsListType = {
  path: 'organizations.users.list';
  orgId: string;
  search?: { [key: string]: unknown };
};

const organizationMembershipsListRoute = {
  'organizations.users.list': (
    _,
    { orgId, search }: Omit<OrganizationMembershipsListType, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: withQueryParams(`/${orgId}/organization_memberships`, search),
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/new_space`,
      navigationState,
    },
  }),
  'organizations.subscription.upgrade_space': (
    _,
    { orgId, spaceId, navigationState }: Omit<OrganizationsSubscriptionUpgradeSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/upgrade_space/${spaceId}`,
      navigationState,
    },
  }),
  'organizations.subscription.overview': (
    _,
    { orgId }: Omit<OrganizationsSubscriptionOverviewRoute, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/subscription_overview`,
    },
  }),
  'organizations.subscription.overview.create-space': (
    _,
    { orgId, planId }: Omit<OrganizationsSubscriptionOverviewCreateSpaceRoute, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: withQueryParams(`/${orgId}/subscription_overview/space_create`, { planId }),
    },
  }),
  'organizations.subscription.overview.space-plans': (
    _,
    { orgId, planId, spaceId }: Omit<OrganizationsSubscriptionOverviewSpacePlansRoute, 'path'>
  ) => ({
    path: 'account.organizations',
    params: {
      pathname: withQueryParams(`/${orgId}/subscription_overview/space_plans`, { planId, spaceId }),
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
    path: 'account.organizations',
    params: {
      pathname: `/${orgId}/organization_memberships/${userId}`,
      userId,
    },
  }),
};

/**
 * StartTrial
 */

type StartTrialType = {
  path: 'account.organizations.start_trial';
  orgId: string;
  navigationState?: {
    existingUsers?: boolean;
    from?: string;
  };
};

const startTrialRoute = {
  'account.organizations.start_trial': (_, params: Omit<StartTrialType, 'path'>) => ({
    path: 'account.organizations',
    params: {
      pathname: `/${params.orgId}/start_trial`,
      navigationState: params.navigationState,
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
  ...organizationsBillingRoute,
  ...organizationsAccessToolsRoutes,
  ...organizationsTeamsRoutes,
  ...organizationAppsRoute,
  ...organizationMembershipsListRoute,
  ...organisationInvitationRoute,
  ...organizationsSubscriptionRoutes,
  ...organizationUserDetailsRoute,
  ...newOrganizationRoute,
  ...startTrialRoute,
};

type OrganizationSettingsRouteType =
  | OrganizationUsageRouteType
  | OrganizationEditRouteType
  | OrganizationOffisiteBackupRouteType
  | OrganizationSubscriptionV1RouteType
  | OrganizationSubscriptionBillingRouteType
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
  | NewOrganizationType
  | StartTrialType;

export type { OrganizationSettingsRouteType };

export { routes };
