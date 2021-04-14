type EnvironmentParams = { withEnvironment: boolean };

const spaceEnvBase = (params: EnvironmentParams, appendix: string) => {
  return [`spaces.detail`, params.withEnvironment ? 'environment' : '', appendix]
    .filter(Boolean)
    .join('.');
};

export type RouteDefinition = {
  path: string | string[];
  params?: { [key: string]: unknown };
};

export type CreateRouteDefinition = (envParams: EnvironmentParams, params?: any) => RouteDefinition;

/** Webhooks */

type WebhookListRouteType = {
  path: 'webhooks.list';
  navigationState?: {
    templateId?: string;
    referrer?: string;
  };
};
type WebhookNewRouteType = { path: 'webhooks.new' };
type WebhookDetailRouteType = { path: 'webhooks.detail'; webhookId: string };
type WebhookDetailCallRouteType = {
  path: 'webhooks.detail.call';
  webhookId: string;
  callId: string;
};
type WebhookRouteType =
  | WebhookListRouteType
  | WebhookNewRouteType
  | WebhookDetailRouteType
  | WebhookDetailCallRouteType;

const webhookRoutes = {
  'webhooks.list': (env: EnvironmentParams, params?: Omit<WebhookListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.webhooks'),
    params: {
      pathname: '/',
      navigationState: params?.navigationState,
    },
  }),
  'webhooks.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.webhooks'),
    params: {
      pathname: '/new',
    },
  }),
  'webhooks.detail': (env: EnvironmentParams, params: Omit<WebhookDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.webhooks'),
    params: {
      pathname: `/${params.webhookId}`,
    },
  }),
  'webhooks.detail.call': (
    env: EnvironmentParams,
    params: Omit<WebhookDetailCallRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'settings.webhooks'),
    params: {
      pathname: `/${params.webhookId}/call/${params.callId}`,
    },
  }),
};

/** Locales */

type LocalesListRouteType = { path: 'locales.list' };
type LocalesNewRouteType = { path: 'locales.new' };
type LocalesDetailRouteType = { path: 'locales.detail'; localeId: string };

type LocalesRouteType = LocalesListRouteType | LocalesNewRouteType | LocalesDetailRouteType;

const localesRoutes = {
  'locales.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: '/',
    },
  }),
  'locales.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: '/new',
    },
  }),
  'locales.detail': (env: EnvironmentParams, params: Omit<LocalesDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.locales'),
    params: {
      pathname: `/${params.localeId}`,
    },
  }),
};

/** Users */

type UsersListRouteType = {
  path: 'users.list';
  navigationState?: {
    jumpToRole?: string;
  };
};

const usersListRoutes = {
  'users.list': (env: EnvironmentParams, params?: Omit<UsersListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.users'),
    params: {
      pathname: '/',
      navigationState: params?.navigationState,
    },
  }),
};

/** Roles & permissions */

type RolesListRouteType = { path: 'roles.list' };
type RolesNewRouteType = {
  path: 'roles.new';
  tab?: string;
  navigationState?: {
    baseRoleId?: string;
  };
};
type RolesDetailRouteType = { path: 'roles.detail'; roleId: string; tab?: string };

type RolesRouteType = RolesListRouteType | RolesNewRouteType | RolesDetailRouteType;

const rolesRoutes = {
  'roles.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings.roles'),
    params: {
      pathname: '/',
    },
  }),
  'roles.new': (env: EnvironmentParams, params: Omit<RolesNewRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.roles'),
    params: {
      pathname: `/new/${params?.tab || 'details'}`,
      navigationState: params?.navigationState,
    },
  }),
  'roles.detail': (env: EnvironmentParams, params: Omit<RolesDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings.roles'),
    params: {
      pathname: `/${params.roleId}/${params?.tab || 'details'}`,
    },
  }),
};

/**
 * All paths combined together
 */

export type RouteType = WebhookRouteType | LocalesRouteType | UsersListRouteType | RolesRouteType;

export const routes = {
  ...webhookRoutes,
  ...localesRoutes,
  ...usersListRoutes,
  ...rolesRoutes,
};
