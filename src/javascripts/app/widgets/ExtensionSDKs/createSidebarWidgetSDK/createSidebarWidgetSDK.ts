import type { Document } from '@contentful/editorial-primitives';
import { createContentTypeApi, InternalContentType } from '../createContentTypeApi';
import { createDialogsApi } from '../createDialogsApi';
import { createEditorApi, LocaleData, Preferences } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { createIdsApiWithoutField } from '../utils';
import { WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi } from '../createUserApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { noop, omit } from 'lodash';
import { createSpaceApi } from '../createSpaceApi';
import { createTagsRepo } from 'features/content-tags';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { createSharedEditorSDK } from '../createSharedEditorSDK';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { EditorInterface } from 'contentful-management/types';
import { getSpaceContext } from 'classes/spaceContext';
import { Proxy } from 'core/services/proxy';
import APIClient from 'data/APIClient';

interface CreateSidebarWidgetSDKOptions {
  internalContentType: InternalContentType;
  doc: Document;
  parameters: {
    instance: Record<string, unknown>;
    installation: Record<string, unknown>;
  };
  editorData: {
    editorInterface: EditorInterface;
  };
  localeData: Proxy<LocaleData>;
  preferences: Proxy<Preferences>;
  spaceContext: ReturnType<typeof getSpaceContext>;
  cma: APIClient;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
  widgetId: string;
  widgetNamespace: WidgetNamespace;
}

export const createSidebarWidgetSDK = ({
  internalContentType,
  editorData,
  localeData,
  preferences,
  doc,
  parameters,
  spaceContext,
  cma,
  fieldLocaleListeners,
  widgetId,
  widgetNamespace,
}: CreateSidebarWidgetSDKOptions): SidebarExtensionSDK => {
  const contentTypeApi = createContentTypeApi(internalContentType);
  const apiClient = getBatchingApiClient(cma);

  const editorApi = createEditorApi({
    editorInterface: editorData.editorInterface,
    getLocaleData: () => localeData,
    getPreferences: () => preferences,
  });

  const entryApi = createEntryApi({
    cma: apiClient,
    internalContentType,
    doc,
    fieldLocaleListeners: fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController` of a current
    // field, but in context of sidebar there is no current field. We should move
    // it to field-locale level in a long run.
    setInvalid: noop,
    widgetId,
    widgetNamespace,
  });

  const userApi = createUserApi(spaceContext.space.data.spaceMember);

  const idsApi = createIdsApiWithoutField({
    spaceId: spaceContext.getId() as string,
    envId: spaceContext.getEnvironmentId() as string,
    envAliasId: spaceContext.getAliasId(),
    contentType: contentTypeApi,
    entry: entryApi,
    user: userApi,
    widgetNamespace,
    widgetId,
  });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.ENTRY_SIDEBAR,
  };

  const spaceApi = createSpaceApi({
    cma: apiClient,
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds: [spaceContext.getEnvironmentId() as string, ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId() as string,
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId() as string),
    usersRepo: spaceContext.users,
    appId: idsApi.app,
  });

  const navigatorApi = createNavigatorApi({
    environmentId: spaceContext.getEnvironmentId() as string,
    spaceId: spaceContext.getId() as string,
    cma: apiClient,
    isMaster: spaceContext.isMasterEnvironment(),
    widgetNamespace,
    widgetId,
  });

  const base = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceMember: spaceContext.space.data.spaceMember,
    locationApi,
    navigatorApi,
    spaceApi,
  });

  const sharedEditorSDK = createSharedEditorSDK({
    contentTypeApi,
    entryApi,
    editorApi,
  });

  const windowApi = {
    // There are no iframes in the internal API so any methods related
    // to <iframe> height can be safely ignored.
    updateHeight: noop,
    startAutoResizer: noop,
    stopAutoResizer: noop,
  };

  const sdkWithoutDialogs: Omit<SidebarExtensionSDK, 'dialogs'> = {
    ...base,
    ...sharedEditorSDK,
    ids: idsApi,
    window: windowApi,
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
