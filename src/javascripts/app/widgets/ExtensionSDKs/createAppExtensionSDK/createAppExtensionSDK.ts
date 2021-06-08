import { AppExtensionSDK } from '@contentful/app-sdk';
import { Widget, WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi } from '../createUserApi';
import { SpaceMember } from 'classes/spaceContextTypes';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceApi } from '../createSpaceApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { AppHookListener, createAppApi } from '../createAppApi';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { AppHookBus } from '@contentful/experience-sdk';
import APIClient from 'data/APIClient';

interface CreateAppExtensionSDKOptions {
  spaceContext: any;
  cma: APIClient;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  appHookBus: AppHookBus;
  currentAppWidget: Widget;
}

export const createAppExtensionSDK = ({
  spaceContext,
  cma,
  widgetNamespace,
  widgetId,
  appHookBus,
  currentAppWidget,
}: CreateAppExtensionSDKOptions): { sdk: AppExtensionSDK; onAppHook: AppHookListener } => {
  const spaceMember: SpaceMember = spaceContext.space.data.spaceMember;

  const userApi = createUserApi(spaceMember);

  const idsApi = {
    user: userApi.sys.id,
    space: spaceContext.getId(),
    environment: spaceContext.getEnvironmentId(),
    environmentAlias: spaceContext.getAliasId(),
    app: widgetId,
  };

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(cma),
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId(),
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
    usersRepo: spaceContext.users,
    appId: idsApi.app,
  });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.APP_CONFIG,
  };

  const navigatorApi = createNavigatorApi({
    environmentId: spaceContext.getEnvironmentId(),
    spaceId: spaceContext.getId(),
    cma,
    isMaster: spaceContext.isMasterEnvironment(),
    widgetNamespace,
    widgetId,
  });

  const base = createBaseExtensionSdk({
    parametersApi: { installation: {}, instance: {} },
    spaceMember,
    locationApi,
    navigatorApi,
    spaceApi,
  });

  const { appApi, onAppHook } = createAppApi({
    cma,
    widgetId,
    widgetNamespace,
    appHookBus,
  });

  const sdkWithoutDialogs: Omit<AppExtensionSDK, 'dialogs'> = {
    ...base,
    ids: {
      user: idsApi.user,
      space: idsApi.space,
      environment: idsApi.environment,
      environmentAlias: idsApi.environmentAlias,
      app: widgetId,
    },
    app: appApi,
  };

  return {
    sdk: {
      ...sdkWithoutDialogs,
      dialogs: createDialogsApi(sdkWithoutDialogs, currentAppWidget),
    },
    onAppHook,
  };
};
