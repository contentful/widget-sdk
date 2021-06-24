import type { EnvironmentParams } from './types';
import { withQueryParams } from './withQueryParams';
import { spaceEnvBase } from './utils';

/** Hibernation */

type HibernationRouteType = {
  path: 'hibernation';
  spaceId?: string;
};

const hibernationRoutes = {
  hibernation: (_, params?: Omit<HibernationRouteType, 'path'>) => ({
    path: spaceEnvBase({ withEnvironment: false }, 'hibernation'),
    params: {
      pathname: '/',
      ...params,
    },
  }),
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
  spaceId?: string;
};

const spaceRoutes = {
  'settings.space': (env: EnvironmentParams, params: Omit<SpaceRouteType, 'path'> = {}) => ({
    path: spaceEnvBase(env, 'settings'),
    params: {
      pathname: '/space',
      ...params,
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
 * Scheduled actions
 */

type ScheduledActionsRouteType = {
  path: 'spaces.details.jobs';
  spaceId?: string;
  environmentId?: string;
};

const scheduledActionsRoute = {
  'spaces.details.jobs': (
    env: EnvironmentParams,
    params: Omit<ScheduledActionsRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'jobs'),
    params: {
      spaceId: params.spaceId,
      environmentId: params.environmentId,
    },
  }),
};

/**
 * Tasks
 */

type TasksRouteType = {
  path: 'tasks';
  spaceId?: string;
  environmentId?: string;
};

const tasksRoute = {
  tasks: (env: EnvironmentParams, params: Omit<TasksRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'tasks'),
    params: Object.assign(
      { pathname: '/' },
      params?.spaceId ? { spaceId: params.spaceId } : {},
      params?.environmentId ? { environmentId: params.environmentId } : {}
    ),
  }),
};

/**
 * Apps
 */

type AppsListRouteType = {
  path: 'apps.list';
  spaceId?: string;
  environmentId?: string;
  app?: string;
  navigationState?: {
    referrer?: string;
  };
};

type AppConfigurationRouteType = {
  path: 'apps.app-configuration';
  appId: string;
  spaceId?: string;
  environmentId?: string;
  navigationState?: {
    acceptedPermissions?: boolean;
    referrer?: string;
  };
};

type AppsPageRouteType = {
  path: 'apps.page';
  spaceId?: string;
  environmentId?: string;
  appId: string;
  pathname: string;
};

type AppsRouteType = AppsListRouteType | AppConfigurationRouteType | AppsPageRouteType;

const appsRoute = {
  'apps.list': (env: EnvironmentParams, params: Omit<AppsListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'apps'),
    params: Object.assign(
      {
        pathname: withQueryParams('/', { app: params?.app }),
        navigationState: params?.navigationState,
      },
      params?.spaceId ? { spaceId: params.spaceId } : {},
      params?.environmentId ? { environmentId: params.environmentId } : {}
    ),
  }),
  'apps.app-configuration': (
    env: EnvironmentParams,
    params: Omit<AppConfigurationRouteType, 'path'>
  ) => ({
    path: spaceEnvBase(env, 'apps'),
    params: Object.assign(
      {
        pathname: `/${params.appId}`,
        navigationState: params?.navigationState,
      },
      params?.spaceId ? { spaceId: params.spaceId } : {},
      params?.environmentId ? { environmentId: params.environmentId } : {}
    ),
  }),
  'apps.page': (env: EnvironmentParams, params: Omit<AppsPageRouteType, 'path'>) => {
    let pathname = params.pathname;
    if (pathname && !pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }
    return {
      path: spaceEnvBase(env, 'apps'),
      params: Object.assign(
        {
          pathname: `/app_installations/${params.appId}${pathname}`,
        },
        params?.spaceId ? { spaceId: params.spaceId } : {},
        params?.environmentId ? { environmentId: params.environmentId } : {}
      ),
    };
  },
};

/**
 * API keys
 */

type ApiKeyListRouteType = {
  path: 'api.keys.list';
  spaceId?: string;
};

type ApiKeyEditorRouteType = {
  path: 'api.keys.detail';
  apiKeyId: string;
  spaceId?: string;
};

type CMATokensType = {
  path: 'api.cma_tokens';
  spaceId?: string;
};

// Legacy routes
type CMAKeysType = {
  path: 'api.cma_keys';
  spaceId?: string;
};

type APIContentModelType = {
  path: 'api.content_model';
  spaceId?: string;
};

const apiKeyListRoute = {
  'api.keys.list': (env: EnvironmentParams, params: Omit<ApiKeyListRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'api'),
    params: {
      pathname: '/keys',
      ...params,
    },
  }),
  'api.keys.detail': (env: EnvironmentParams, params: Omit<ApiKeyEditorRouteType, 'path'>) => ({
    path: spaceEnvBase(env, 'api'),
    params: {
      pathname: `/keys/${params.apiKeyId}`,
      ...params,
    },
  }),
  'api.cma_tokens': (env: EnvironmentParams, params: Omit<CMATokensType, 'path'>) => ({
    path: spaceEnvBase(env, 'api'),
    params: {
      pathname: '/cma_tokens',
      ...params,
    },
  }),
  'api.cma_keys': (env: EnvironmentParams, params: Omit<CMAKeysType, 'path'>) => ({
    path: spaceEnvBase(env, 'api'),
    params: {
      pathname: '/cma_keys',
      ...params,
    },
  }),
  'api.content_model': (env: EnvironmentParams, params: Omit<APIContentModelType, 'path'>) => ({
    path: spaceEnvBase(env, 'api'),
    params: {
      pathname: '/content_model',
      ...params,
    },
  }),
};

/**
 * Onboarding routes
 */

type OnboardingGetStartedRouteType = {
  path: 'spaces.detail.onboarding.getStarted';
  spaceId?: string;
};

type OnboardingCopyRouteType = {
  path: 'spaces.detail.onboarding.copy';
  spaceId?: string;
};

type OnboardingExploreRouteType = {
  path: 'spaces.detail.onboarding.explore';
  spaceId?: string;
};

type OnboardingDeployRouteType = {
  path: 'spaces.detail.onboarding.deploy';
  spaceId?: string;
};

const onboardingRoute = {
  'spaces.detail.onboarding.getStarted': (
    _,
    params: Omit<OnboardingGetStartedRouteType, 'path'>
  ) => ({
    path: 'spaces.detail.onboarding',
    params: {
      pathname: '/getStarted',
      spaceId: params.spaceId,
    },
  }),
  'spaces.detail.onboarding.copy': (_, params: Omit<OnboardingCopyRouteType, 'path'>) => ({
    path: 'spaces.detail.onboarding',
    params: {
      pathname: '/copy',
      spaceId: params.spaceId,
    },
  }),
  'spaces.detail.onboarding.explore': (_, params: Omit<OnboardingExploreRouteType, 'path'>) => ({
    path: 'spaces.detail.onboarding',
    params: {
      pathname: '/explore',
      spaceId: params.spaceId,
    },
  }),
  'spaces.detail.onboarding.deploy': (_, params: Omit<OnboardingDeployRouteType, 'path'>) => ({
    path: 'spaces.detail.onboarding',
    params: {
      pathname: '/deploy',
      spaceId: params.spaceId,
    },
  }),
};

/**
 * All paths combined together
 */

export type SpaceSettingsRouteType =
  | HibernationRouteType
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
  | PageExtensionsRouteType
  | ScheduledActionsRouteType
  | TasksRouteType
  | AppsRouteType
  | ApiKeyListRouteType
  | ApiKeyEditorRouteType
  | CMATokensType
  | CMAKeysType
  | APIContentModelType
  | OnboardingGetStartedRouteType
  | OnboardingCopyRouteType
  | OnboardingExploreRouteType
  | OnboardingDeployRouteType;

export const routes = {
  ...hibernationRoutes,
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
  ...scheduledActionsRoute,
  ...tasksRoute,
  ...apiKeyListRoute,
  ...appsRoute,
  ...onboardingRoute,
};
