/** SpaceHome */

type SpaceHomeRouteType = {
  path: 'spaces.detail.home';
  spaceId?: string;
};

const spaceHomeRoutes = {
  'spaces.detail.home': (_, params?: Omit<SpaceHomeRouteType, 'path'>) => ({
    path: 'spaces.detail.home',
    params: {
      pathname: '/',
      ...params,
    },
  }),
};

/**
 * All paths combined together
 */

export type SpacesRouteType = SpaceHomeRouteType;

export const routes = {
  ...spaceHomeRoutes,
};
