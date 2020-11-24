import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { SpaceMember, createUserApi } from '../createUserApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceApi } from '../createSpaceApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { createIdsApi } from './utils';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';

interface CreatePageWidgetSDKOptions {
  spaceContext: any;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createPageWidgetSDK = ({
  spaceContext,
  widgetNamespace,
  widgetId,
  parameters,
}: CreatePageWidgetSDKOptions): PageExtensionSDK => {
  const userApi = createUserApi(spaceContext.space.data.spaceMember);

  const idsApi = createIdsApi({
    spaceId: spaceContext.getId(),
    envId: spaceContext.getEnvironmentId(),
    envAliasId: spaceContext.getAliasId(),
    user: userApi,
    widgetNamespace,
    widgetId,
  });

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
    is: (location: string) => location === WidgetLocation.PAGE,
  };

  const navigatorApi = createNavigatorApi({
    spaceContext,
    widgetNamespace,
    widgetId,
    isOnPageLocation: true,
  });

  const base = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceMember: spaceContext.space.data.spaceMember as SpaceMember,
    locationApi,
    navigatorApi,
    spaceApi,
  });

  const sdkWithoutDialogs: Omit<PageExtensionSDK, 'dialogs'> = {
    ...base,
    ids: idsApi,
  };

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogs),
  };
};
