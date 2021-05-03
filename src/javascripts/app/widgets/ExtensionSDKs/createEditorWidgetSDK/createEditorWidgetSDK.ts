import { EditorExtensionSDK } from '@contentful/app-sdk';
import { createContentTypeApi, InternalContentType } from '../createContentTypeApi';
import type { Document } from '@contentful/editorial-primitives';
import { WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi } from '../createUserApi';
import { createEditorApi, LocaleData, Preferences } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceApi } from '../createSpaceApi';
import { createIdsApiWithoutField } from '../utils';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { createSharedEditorSDK } from '../createSharedEditorSDK';
import { noop, omit } from 'lodash';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { createAPIClient } from 'core/services/APIClient/utils';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUserCache from 'data/userCache';
import { getEnvironmentAliasesIds, isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { PubSubClient } from 'services/PubSubService';
import { Source } from 'i13n/constants';
import { EditorInterface } from 'contentful-management/types';
import { Proxy } from 'core/services/proxy';
import { Environment, SpaceEnv } from 'core/services/SpaceEnvContext/types';

interface CreateEditorExtensionSDKOptions {
  internalContentType: InternalContentType;
  doc: Document;
  editorData: {
    editorInterface: EditorInterface;
  };
  localeData: Proxy<LocaleData>;
  preferences: Proxy<Preferences>;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
  contentTypes: InternalContentType[];
  environment: Environment;
  environmentId: string;
  environmentAliasId?: string;
  space: SpaceEnv;
  spaceId: string;
  pubSubClient?: PubSubClient;
}

export const createEditorWidgetSDK = ({
  editorData,
  localeData,
  preferences,
  internalContentType,
  widgetNamespace,
  widgetId,
  parameters,
  doc,
  fieldLocaleListeners,
  spaceId,
  environmentId,
  environmentAliasId,
  space,
  environment,
  contentTypes,
  pubSubClient,
}: CreateEditorExtensionSDKOptions): EditorExtensionSDK => {
  const contentTypeApi = createContentTypeApi(internalContentType);
  const source =
    widgetNamespace === WidgetNamespace.EDITOR_BUILTIN ? undefined : Source.CustomWidget;
  const cma = createAPIClient(spaceId, environmentId, source);
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const usersRepo = createUserCache(spaceEndpoint);
  const aliasesId = getEnvironmentAliasesIds(environment);
  const isMaster = isMasterEnvironment(environment);

  const editorApi = createEditorApi({
    editorInterface: editorData.editorInterface,
    getLocaleData: () => localeData,
    getPreferences: () => preferences,
  });

  const userApi = createUserApi(space.data.spaceMember);

  const entryApi = createEntryApi({
    cma,
    internalContentType,
    doc,
    fieldLocaleListeners: fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController` of a current
    // field, but in context of editor there is no current field. We should move
    // it to field-locale level in a long run.
    setInvalid: noop,
    widgetNamespace,
    widgetId,
  });

  const idsApi = createIdsApiWithoutField({
    spaceId: spaceId,
    envId: environmentId,
    envAliasId: environmentAliasId,
    contentType: contentTypeApi,
    entry: entryApi,
    user: userApi,
    widgetNamespace,
    widgetId,
  });

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(cma),
    initialContentTypes: contentTypes,
    environmentIds: [environmentId, ...aliasesId],
    spaceId: spaceId,
    tagsRepo: createTagsRepo(spaceEndpoint, environmentId),
    usersRepo,
    appId: idsApi.app,
    pubSubClient,
  });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.ENTRY_EDITOR,
  };

  const navigatorApi = createNavigatorApi({
    widgetNamespace,
    widgetId,
    isMaster,
    spaceId,
    environmentId,
    cma,
  });

  const base = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceMember: space.data.spaceMember,
    locationApi,
    navigatorApi,
    spaceApi,
  });

  const sharedEditorSDK = createSharedEditorSDK({
    contentTypeApi,
    entryApi,
    editorApi,
  });

  const sdkWithoutDialogs: Omit<EditorExtensionSDK, 'dialogs'> = {
    ...base,
    ...sharedEditorSDK,
    ids: idsApi,
  };

  // We don't want to leak entry specific information
  const sdkWithoutDialogsAndIds = {
    ...sdkWithoutDialogs,
    ids: omit(sdkWithoutDialogs.ids, ['entry', 'contentType']),
  };

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogsAndIds),
  };
};
