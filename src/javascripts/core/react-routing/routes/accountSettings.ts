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

export type AccountSettingsRouteType = AccountProfileCMATokensType;

export const routes = {
  ...accountProfileCMATokensRoute,
};
