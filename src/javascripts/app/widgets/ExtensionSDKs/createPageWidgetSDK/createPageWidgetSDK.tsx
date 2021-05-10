import { PageExtensionSDK } from '@contentful/app-sdk';
import { WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi, SpaceMember } from '../createUserApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceApi } from '../createSpaceApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { createIdsApi } from './utils';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { PubSubClient } from 'services/PubSubService';
import { getEnvironment, isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { createAPIClient } from 'core/services/APIClient/utils';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUserCache from 'data/userCache';
import { Source } from 'i13n/constants';

interface CreatePageWidgetSDKOptions {
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  contentTypes: any[];
  environmentId: string;
  space: any;
  spaceId: string;
  environmentAliasId: string | null;
  pubSubClient: PubSubClient;
  aliasesIds: string[];
}

export const createPageWidgetSDK = ({
  widgetNamespace,
  widgetId,
  parameters,
  spaceId,
  environmentId,
  environmentAliasId,
  contentTypes,
  aliasesIds,
  space,
  pubSubClient,
}: CreatePageWidgetSDKOptions): PageExtensionSDK => {
  const userApi = createUserApi(space.data.spaceMember);
  const environment = getEnvironment(space);
  const source = widgetNamespace === WidgetNamespace.BUILTIN ? undefined : Source.CustomWidget;
  const cma = createAPIClient(spaceId, environmentAliasId ?? environmentId, source);
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const usersRepo = createUserCache(spaceEndpoint);
  const isMaster = isMasterEnvironment(environment);

  const idsApi = createIdsApi({
    spaceId,
    envId: environmentId,
    envAliasId: environmentAliasId,
    user: userApi,
    widgetNamespace,
    widgetId,
  });

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(cma),
    initialContentTypes: contentTypes,
    pubSubClient,
    environmentIds: [environmentId, ...aliasesIds],
    spaceId,
    tagsRepo: createTagsRepo(spaceEndpoint, environmentId),
    usersRepo,
    appId: idsApi.app,
  });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.PAGE,
  };

  const navigatorApi = createNavigatorApi({
    environmentId,
    spaceId,
    cma,
    isMaster,
    widgetNamespace,
    widgetId,
    isOnPageLocation: true,
  });

  const base = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceMember: space.data.spaceMember as SpaceMember,
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
