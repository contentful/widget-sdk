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
 * All paths combined together
 */

const routes = {
  ...accountProfileCMATokensRoute,
  ...accountProfileSpaceMembershipsRoute,
};

type AccountSettingsRouteType = AccountProfileCMATokensType | AccountProfileSpaceMembershipsType;

export type { AccountSettingsRouteType };

export { routes };
