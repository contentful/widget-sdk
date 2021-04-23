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
 * AccountProfileOrgMembership
 */

type AccountProfileOrgMembership = {
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
  ...accountProfileSpaceMembershipsRoute,
  ...accountProfileOrgMembershipRoute,
};

type AccountSettingsRouteType =
  | AccountProfileCMATokensType
  | AccountProfileSpaceMembershipsType
  | AccountProfileOrgMembership;

export type { AccountSettingsRouteType };

export { routes };
