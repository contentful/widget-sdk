import type { EnvironmentParams } from './types';

const spaceEnvBase = (params: EnvironmentParams, appendix: string) => {
  return [`spaces.detail`, params.withEnvironment ? 'environment' : '', appendix]
    .filter(Boolean)
    .join('.');
};

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
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/webhooks',
      navigationState: params?.navigationState,
    },
  }),
  'webhooks.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/webhooks/new',
    },
  }),
  'webhooks.detail': (env: EnvironmentParams, params: Omit<WebhookDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/webhooks/${params.webhookId}`,
    },
  }),
  'webhooks.detail.call': (
    env: EnvironmentParams,
    params: Omit<WebhookDetailCallRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/webhooks/${params.webhookId}/call/${params.callId}`,
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
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/locales',
    },
  }),
  'locales.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/locales/new',
    },
  }),
  'locales.detail': (env: EnvironmentParams, params: Omit<LocalesDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/locales/${params.localeId}`,
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
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/users',
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
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/roles',
    },
  }),
  'roles.new': (env: EnvironmentParams, params: Omit<RolesNewRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/roles/new/${params?.tab || 'details'}`,
      navigationState: params?.navigationState,
    },
  }),
  'roles.detail': (env: EnvironmentParams, params: Omit<RolesDetailRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/roles/${params.roleId}/${params?.tab || 'details'}`,
    },
  }),
};

/** Tags */

type TagsRouteType = { path: 'tags' };

const tagsRoutes = {
  tags: (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/tags',
    },
  }),
};

/**
 * Extensions
 */

type ExtensionsListRouteType = {
  path: 'extensions.list';
  navigationState?: {
    referrer?: string;
    extensionUrl?: string;
  };
};
type ExtensionsDetailRouteType = { path: 'extensions.detail'; extensionsId: string };

type ExtensionsRouteType = ExtensionsListRouteType | ExtensionsDetailRouteType;

const extensionsRoutes = {
  'extensions.list': (env: EnvironmentParams, params?: Omit<ExtensionsListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/extensions',
      navigationState: params?.navigationState,
    },
  }),
  'extensions.detail': (
    env: EnvironmentParams,
    params: Omit<ExtensionsDetailRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/extensions/${params.extensionsId}`,
    },
  }),
};

/** Content preview **/

type ContentPreviewListRouteType = { path: 'content_preview.list' };
type ContentPreviewNewRouteType = { path: 'content_preview.new' };
type ContentPreviewDetailRouteType = { path: 'content_preview.detail'; contentPreviewId: string };

type ContentPreviewRouteType =
  | ContentPreviewListRouteType
  | ContentPreviewNewRouteType
  | ContentPreviewDetailRouteType;

const contentPreviewRoutes = {
  'content_preview.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/content_preview',
    },
  }),
  'content_preview.new': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/content_preview/new`,
    },
  }),
  'content_preview.detail': (
    env: EnvironmentParams,
    params: Omit<ContentPreviewDetailRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: `/content_preview/${params.contentPreviewId}`,
    },
  }),
};

/** Usage */

type SpaceUsageRouteType = {
  path: 'usage';
  spaceId?: string;
};

const spaceUsageRoutes = {
  usage: (env: EnvironmentParams, params?: Omit<SpaceUsageRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/usage',
      ...params,
    },
  }),
};

/** Environments */

type EnvironmentsRouteType = {
  path: 'settings.environments';
  environmentId?: string;
};

const environmentsRoutes = {
  'settings.environments': (
    env: EnvironmentParams,
    params?: Omit<EnvironmentsRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/environments',
      ...params,
    },
  }),
};

/** Teams */

type TeamsListRouteType = { path: 'teams.list' };
type TeamsAddRouteType = { path: 'teams.add' };
type TeamsRouteType = TeamsListRouteType | TeamsAddRouteType;

const teamsRoutes = {
  'teams.list': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/teams',
    },
  }),
  'teams.add': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/teams/add',
    },
  }),
};

/** Space */

type SpaceRouteType = {
  path: 'settings.space';
};

const spaceRoutes = {
  'settings.space': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/space',
    },
  }),
};

/** Embargoed assets */

type EmbargoedAssetsRouteType = {
  path: 'settings.embargoedAssets';
};

const embargoedAssetsRoutes = {
  'settings.embargoedAssets': (env: EnvironmentParams) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/embargoed-assets',
    },
  }),
};

/**
 * Page extensions
 */

type PageExtensionsRouteType = {
  path: 'page-extension';
  extensionId: string;
  spaceId?: string;
  environmentId?: string;
  pathname?: string;
};

const pageExtensionRoute = {
  'page-extension': (env: EnvironmentParams, params: Omit<PageExtensionsRouteType, 'path'>) => {
    let pathname = params.pathname;

    if (pathname && !pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }

    return {
      path: spaceEnvBase(env, 'pageExtensions'),
      params: {
        pathname: `/${params.extensionId}${pathname}`,
        spaceId: params.spaceId,
        environmentId: params.environmentId,
      },
    };
  },
};

/**
 * All paths combined together
 */

export type SpaceSettingsRouteType =
  | WebhookRouteType
  | LocalesRouteType
  | UsersListRouteType
  | RolesRouteType
  | ExtensionsRouteType
  | TagsRouteType
  | ContentPreviewRouteType
  | TeamsRouteType
  | SpaceUsageRouteType
  | EnvironmentsRouteType
  | SpaceRouteType
  | EmbargoedAssetsRouteType
  | PageExtensionsRouteType;

export const routes = {
  ...webhookRoutes,
  ...localesRoutes,
  ...usersListRoutes,
  ...rolesRoutes,
  ...extensionsRoutes,
  ...tagsRoutes,
  ...contentPreviewRoutes,
  ...teamsRoutes,
  ...environmentsRoutes,
  ...spaceUsageRoutes,
  ...spaceRoutes,
  ...embargoedAssetsRoutes,
  ...pageExtensionRoute,
};
