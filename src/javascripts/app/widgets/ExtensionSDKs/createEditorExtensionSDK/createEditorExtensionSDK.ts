import { EditorExtensionSDK } from '@contentful/app-sdk';
import { InternalContentType, createContentTypeApi } from '../createContentTypeApi';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { createUserApi, SpaceMember } from '../createUserApi';
import { createEditorApi } from '../createEditorApi';
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

interface CreateEditorExtensionSDKOptions {
  internalContentType: InternalContentType;
  doc: Document;
  editorData: any;
  localeData: any;
  preferences: any;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
  contentTypes: InternalContentType[];
  environment: any;
  environmentId: string;
  space: any;
  spaceId: string;
  pubSubClient?: PubSubClient;
}

export const createEditorExtensionSDK = ({
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
  space,
  environment,
  contentTypes,
  pubSubClient,
}: CreateEditorExtensionSDKOptions): EditorExtensionSDK => {
  const contentTypeApi = createContentTypeApi(internalContentType);
  const cma = createAPIClient(spaceId, environmentId);
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const usersRepo = createUserCache(spaceEndpoint);
  const aliasesId = getEnvironmentAliasesIds(environment);
  const isMaster = isMasterEnvironment(environment);

  const editorApi = createEditorApi({
    editorInterface: editorData.editorInterface,
    getLocaleData: () => localeData,
    getPreferences: () => preferences,
  });

  const userApi = createUserApi(space.data.spaceMember as SpaceMember);

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
    spaceMember: space.data.spaceMember as SpaceMember,
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
