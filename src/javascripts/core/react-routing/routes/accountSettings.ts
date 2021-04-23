type AccountProfileSpaceMembershipsType = {
  path: 'account.space_memberships';
};

const accountProfileSpaceMembershipsRoute = {
  'account.space_memberships': () => ({
    path: 'account.profile.space_memberships',
    params: {
      pathname: '/',
    },
  }),
};

/**
 * AccountProfileCMATokens
 */

type AccountProfileCMATokensType = {
  path: 'account.cma_tokens';
};

const accountProfileCMATokensRoute = {
  'account.cma_tokens': () => ({
    path: 'account.profile.cma_tokens',
    params: {
      pathname: '/',
    },
  }),
};

/**
 * AccountProfileOAuthTokens
 */

type AccountProfileOAuthTokensType = {
  path: 'account.oauth_tokens';
};

const accountProfileOAuthTokensRoute = {
  'account.oauth_tokens': () => ({
    path: 'account.profile.access_grants',
    params: {
      pathname: '/',
    },
  }),
};

/**
 * AccountProfileOAuthApplications
 */

type AccountProfileOAuthApplicationsType = {
  path: 'account.oauth_application';
};

const accountProfileOAuthApplicationsRoute = {
  'account.oauth_application': () => ({
    path: 'account.profile.applications',
    params: {
      pathname: '/',
    },
  }),
};

/**
 *  AccountProfileOrgMembership
 */

type AccountProfileOrgMembershipType = {
  path: 'account.organization_memberships';
};

const accountProfileOrgMembershipRoute = {
  'account.organization_memberships': () => ({
    path: 'account.profile.organization_memberships',
    params: {
      pathname: '/',
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
};

type AccountSettingsRouteType =
  | AccountProfileCMATokensType
  | AccountProfileSpaceMembershipsType
  | AccountProfileOrgMembershipType
  | AccountProfileOAuthApplicationsType
  | AccountProfileOAuthTokensType;

export type { AccountSettingsRouteType };

export { routes };
