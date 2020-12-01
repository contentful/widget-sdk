import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { noop } from 'lodash';

import { EditorInterface, WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { SpaceEndpoint } from 'data/CMA/types';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';
import { PubSubClient } from 'services/PubSubService';
import localeStore from 'services/localeStore';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { create } from 'app/entity_editor/Document/CmaDocument';
import { Entity } from 'app/entity_editor/Document/types';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createEditorApi, LocaleData, Preferences } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { createSpaceApi } from '../createSpaceApi';
import { createReadOnlyNavigatorApi } from '../createNavigatorApi';
import { createReadOnlyDialogsApi } from '../createDialogsApi';
import { SpaceMember, createUserApi } from '../createUserApi';
import { InternalContentType, createContentTypeApi } from '../createContentTypeApi';
import { createIdsApi } from '../createIdsApi';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { createSharedEditorSDK } from '../createSharedEditorSDK';
import { proxify } from 'core/services/proxy';

interface CreateReadOnlyFieldWidgetSDKOptions {
  cma: any;
  editorInterface: EditorInterface;
  endpoint: SpaceEndpoint;
  entry: Entity;
  publicFieldId: Field['id'] | Field['apiName'];
  fieldValue: any;
  initialContentTypes: InternalContentType[];
  internalContentType: InternalContentType;
  publicLocaleCode: Locale['code'];
  spaceId: string;
  environmentId: string;
  currentEnvironmentAliasId?: string;
  allEnvironmentAliasIds: string[];
  spaceMember: SpaceMember;
  tagsRepo: any;
  usersRepo: any;
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

export function createReadonlyFieldWidgetSDK({
  cma,
  editorInterface,
  endpoint,
  entry,
  publicFieldId,
  initialContentTypes,
  internalContentType,
  publicLocaleCode,
  spaceId,
  environmentId,
  currentEnvironmentAliasId,
  allEnvironmentAliasIds,
  spaceMember,
  tagsRepo,
  usersRepo,
  widgetId,
  widgetNamespace,
  parameters,
}: CreateReadOnlyFieldWidgetSDKOptions): FieldExtensionSDK {
  const pubSubClient = { on: noop, off: noop } as PubSubClient;
  const readOnlyEntityRepo = createEntityRepo(endpoint, pubSubClient, noop, {
    skipDraftValidation: true,
    skipTransformation: true,
    indicateAutoSave: false,
  });
  const doc: Document = create(
    {
      data: entry,
      setDeleted: noop,
    },
    internalContentType,
    readOnlyEntityRepo,
    5000
  );

  const userApi = createUserApi(spaceMember);

  const editorApi = createEditorApi({
    editorInterface: editorInterface,
    getLocaleData: () => {
      return proxify({
        defaultLocale: localeStore.getDefaultLocale(),
        privateLocales: localeStore.getPrivateLocales(),
        focusedLocale: localeStore.getFocusedLocale(),
        isSingleLocaleModeOn: localeStore.isSingleLocaleModeOn(),
        isLocaleActive: localeStore.isLocaleActive,
      } as LocaleData);
    },
    // TODO: the value of preferences.showDisabledFields doesn't seem to affect the snapshot view.
    //  Also, preferences.showDisabledFields is the only preference which seems to be used in the
    //  Editor API. Is it safe to assume this is useless and can be nooped?
    getPreferences: () => proxify({ showDisabledFields: true } as Preferences),
  });

  const entryApi = createEntryApi({
    internalContentType: internalContentType,
    doc,
    setInvalid: noop,
    fieldLocaleListeners: {},
    readOnly: true,
    widgetId,
    widgetNamespace,
  });

  const contentTypeApi = createContentTypeApi(internalContentType);

  const locationApi = {
    is: (location: string) => location === WidgetLocation.ENTRY_FIELD,
  };

  const windowApi = {
    // There are no iframes in the internal API so any methods related
    // to <iframe> height can be safely ignored.
    updateHeight: noop,
    startAutoResizer: noop,
    stopAutoResizer: noop,
  };

  const navigatorApi = createReadOnlyNavigatorApi();

  const dialogsApi = createReadOnlyDialogsApi();

  const fieldApi = entryApi.fields[publicFieldId].getForLocale(publicLocaleCode);

  const idsApi = createIdsApi({
    spaceId,
    envId: environmentId,
    envAliasId: currentEnvironmentAliasId || null,
    contentType: internalContentType,
    entry: entryApi,
    field: fieldApi,
    user: userApi,
    widgetNamespace,
    widgetId,
  });

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(cma),
    initialContentTypes,
    pubSubClient,
    environmentIds: [environmentId, ...allEnvironmentAliasIds],
    spaceId,
    tagsRepo,
    usersRepo,
    readOnly: true,
    appId: idsApi.app,
  });

  const baseSdkWithoutDialogs = createBaseExtensionSdk({
    locationApi,
    navigatorApi,
    parametersApi: parameters,
    spaceApi,
    spaceMember,
  });

  const sharedEditorSDK = createSharedEditorSDK({
    contentTypeApi,
    entryApi,
    editorApi,
  });

  return {
    ...baseSdkWithoutDialogs,
    ...sharedEditorSDK,
    dialogs: dialogsApi,
    ids: idsApi,
    field: fieldApi,
    window: windowApi,
  };
}
