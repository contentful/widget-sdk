import { EnvironmentParams } from './types';
import { spaceEnvBase } from './utils';

type ContentTypesListRouteType = {
  path: 'content_types.list';
  spaceId?: string;
};
type ContentTypesNewRouteType = {
  path: 'content_types.new';
  tab?: string;
};
type ContentTypesDetailRouteType = {
  path: 'content_types.detail';
  contentTypeId: string;
  tab?: string;
};

export type ContentTypesRouteType =
  | ContentTypesListRouteType
  | ContentTypesNewRouteType
  | ContentTypesDetailRouteType;

export const routes = {
  'content_types.list': (
    env: EnvironmentParams,
    params?: Omit<ContentTypesListRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'content_types'),
    params: {
      pathname: '/',
      ...params,
    },
  }),
  'content_types.new': (
    env: EnvironmentParams,
    params: Omit<ContentTypesNewRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'content_types'),
    params: {
      pathname: `/new/${params?.tab || 'fields'}`,
    },
  }),
  'content_types.detail': (
    env: EnvironmentParams,
    params: Omit<ContentTypesDetailRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'content_types'),
    params: {
      pathname: `/${params.contentTypeId}/${params?.tab || 'fields'}`,
    },
  }),
};
