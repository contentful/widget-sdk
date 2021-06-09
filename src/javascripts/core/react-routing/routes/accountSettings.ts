/**
 * AccountProfileUser
 */

type AccountProfileUserType = {
  path: 'account.profile.user';
};

const accountProfileUserRoute = {
  'account.profile.user': () => ({
    path: 'account.profile',
    params: {
      pathname: '/user',
    },
  }),
};

/**
 * AccountProfileSpaceMemberships
 */

type AccountProfileSpaceMembershipsType = {
  path: 'account.profile.space_memberships';
};

const accountProfileSpaceMembershipsRoute = {
  'account.profile.space_memberships': () => ({
    path: 'account.profile',
    params: {
      pathname: '/space_memberships',
    },
  }),
};

/**
 * AccountProfileCMATokens
 */

type AccountProfileCMATokensType = {
  path: 'account.profile.cma_tokens';
};

const accountProfileCMATokensRoute = {
  'account.profile.cma_tokens': () => ({
    path: 'account.profile',
    params: {
      pathname: '/cma_tokens',
    },
  }),
};

/**
 * AccountProfileOAuthTokens
 */

type AccountProfileOAuthTokensType = {
  path: 'account.profile.oauth_tokens';
};

const accountProfileOAuthTokensRoute = {
  'account.profile.oauth_tokens': () => ({
    path: 'account.profile',
    params: {
      pathname: '/access_grants',
    },
  }),
};

/**
 * AccountProfileOAuthApplications
 */

type AccountProfileOAuthApplicationsType = {
  path: 'account.profile.oauth_application';
};

const accountProfileOAuthApplicationsRoute = {
  'account.profile.oauth_application': () => ({
    path: 'account.profile',
    params: {
      pathname: '/developers/applications',
    },
  }),
};

/**
 *  AccountProfileOrgMembership
 */

type AccountProfileOrgMembershipType = {
  path: 'account.profile.organization_memberships';
};

const accountProfileOrgMembershipRoute = {
  'account.profile.organization_memberships': () => ({
    path: 'account.profile',
    params: {
      pathname: '/organization_memberships',
    },
  }),
};

/**
 * All paths combined together
 */

const routes = {
  ...accountProfileCMATokensRoute,
  ...accountProfileOAuthTokensRoute,
  ...accountProfileSpaceMembershipsRoute,
  ...accountProfileOAuthApplicationsRoute,
  ...accountProfileOrgMembershipRoute,
  ...accountProfileUserRoute,
};

type AccountSettingsRouteType =
  | AccountProfileCMATokensType
  | AccountProfileSpaceMembershipsType
  | AccountProfileOrgMembershipType
  | AccountProfileOAuthApplicationsType
  | AccountProfileOAuthTokensType
  | AccountProfileUserType;

export type { AccountSettingsRouteType };

export { routes };
