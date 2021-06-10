import { EnvironmentParams } from './types';
import { spaceEnvBase } from './utils';

type AssetsListRouteType = { path: 'assets.list' };

export type AssetsRouteType = AssetsListRouteType;

export const routes = {
  'assets.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'assets.list'),
    params: {
      pathname: '/',
    },
  }),
};
