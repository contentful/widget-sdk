import { EnvironmentParams } from './types';
import { spaceEnvBase } from './utils';

type EntriesListRouteType = { path: 'entries.list'; spaceId?: string; environmentId?: string };

export type EntriesRouteType = EntriesListRouteType;

export const routes = {
  'entries.list': (env: EnvironmentParams, params: Omit<EntriesListRouteType, 'path'> = {}) => ({
    path: spaceEnvBase(env, 'entries.list'),
    params: {
      pathname: '/',
      ...params,
    },
  }),
};
