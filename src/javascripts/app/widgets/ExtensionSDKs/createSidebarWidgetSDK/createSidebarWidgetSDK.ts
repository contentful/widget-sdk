import { Document } from 'app/entity_editor/Document/typesDocument';
import { createContentTypeApi, InternalContentType } from '../createContentTypeApi';
import { createDialogsApi } from '../createDialogsApi';
import { createEditorApi, LocaleData, Preferences } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { createIdsApiWithoutField } from '../utils';
import { WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi, SpaceMember } from '../createUserApi';
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
import { getModule } from 'core/NgRegistry';
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
  spaceContext: ReturnType<typeof getModule>;
  cma: APIClient;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
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
  widgetNamespace,
  widgetId,
  fieldLocaleListeners,
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
    widgetNamespace,
    widgetId,
  });

  const userApi = createUserApi(spaceContext.space.data.spaceMember);

  const idsApi = createIdsApiWithoutField({
    spaceId: spaceContext.getId(),
    envId: spaceContext.getEnvironmentId(),
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
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId(),
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
    usersRepo: spaceContext.users,
    appId: idsApi.app,
  });

  const navigatorApi = createNavigatorApi({
    environmentId: spaceContext.getEnvironmentId(),
    spaceId: spaceContext.getId(),
    cma: apiClient,
    isMaster: spaceContext.isMasterEnvironment(),
    widgetNamespace,
    widgetId,
  });

  const base = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceMember: spaceContext.space.data.spaceMember as SpaceMember,
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
