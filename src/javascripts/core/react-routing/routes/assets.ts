import { EnvironmentParams } from './types';
import { spaceEnvBase } from './utils';

type AssetsListRouteType = { path: 'assets.list'; spaceId?: string; environmentId?: string };

export type AssetsRouteType = AssetsListRouteType;

export const routes = {
  'assets.list': (env: EnvironmentParams, params: Omit<AssetsListRouteType, 'path'> = {}) => ({
    path: spaceEnvBase(env, 'assets.list'),
    params: {
      pathname: '/',
      ...params,
    },
  }),
};
