import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace, WidgetLocation, Widget } from '@contentful/widget-renderer';
import { SpaceMember, createUserApi } from '../createUserApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceApi } from '../createSpaceApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { createAppApi, AppHookListener } from '../createAppApi';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { AppHookBus } from 'features/apps-core';

interface CreateAppExtensionSDKOptions {
  spaceContext: any;
  $scope: any;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  appHookBus: AppHookBus;
  currentAppWidget: Widget;
}

export const createAppExtensionSDK = ({
  spaceContext,
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
    app: widgetId,
  };

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(spaceContext.cma),
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
    cma: spaceContext.cma,
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
    spaceContext,
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
