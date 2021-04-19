import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { InternalContentType, createContentTypeApi } from '../createContentTypeApi';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { createTagsRepo } from 'features/content-tags';
import { createEditorApi } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { createSpaceApi } from '../createSpaceApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { createDialogsApi } from '../createDialogsApi';
import { createIdsApi } from '../createIdsApi';
import { createUserApi } from '../createUserApi';
import { noop, omit } from 'lodash';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { createSharedEditorSDK } from '../createSharedEditorSDK';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUserCache from 'data/userCache';
import { getEnvironmentAliasesIds, isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { PubSubClient } from 'services/PubSubService';
import APIClient from 'data/APIClient';

export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  editorData,
  localeData,
  preferences,
  setInvalid,
  doc,
  internalContentType,
  fieldLocaleListeners,
  parameters,
  spaceId,
  environmentAliasId,
  environmentId,
  space,
  environment,
  contentTypes,
  pubSubClient,
  cma,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  editorData: any;
  localeData: any;
  preferences: any;
  setInvalid: any;
  doc: Document;
  internalContentType: InternalContentType;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  contentTypes: any[];
  environment: any;
  environmentId: string;
  environmentAliasId?: string;
  space: any;
  spaceId: string;
  pubSubClient?: PubSubClient;
  cma: APIClient;
}): FieldExtensionSDK {
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
  const usersRepo = createUserCache(spaceEndpoint);
  const aliasesId = getEnvironmentAliasesIds(environment);
  const isMaster = isMasterEnvironment(environment);

  const editorApi = createEditorApi({
    editorInterface: editorData.editorInterface,
    getLocaleData: () => localeData,
    getPreferences: () => preferences,
  });

  const contentTypeApi = createContentTypeApi(internalContentType);

  const entryApi = createEntryApi({
    cma,
    internalContentType,
    doc,
    fieldLocaleListeners: fieldLocaleListeners.lookup,
    widgetNamespace,
    widgetId,
    // TODO: `setInvalid` is only available on `fieldController`. The SDK can only
    //   mark the current field as invalid. We could consider moving `setInvalid` to
    //   the field-locale level.
    setInvalid: (localeCode, isInvalid) => {
      if (setInvalid) {
        return setInvalid(localeCode, isInvalid);
      }
    },
  });

  const navigatorApi = createNavigatorApi({
    environmentId,
    spaceId,
    cma,
    isMaster,
    widgetNamespace,
    widgetId,
  });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.ENTRY_FIELD,
  };

  const fieldApi = entryApi.fields[fieldId].getForLocale(localeCode);

  const userApi = createUserApi(space.data.spaceMember);

  const idsApi = createIdsApi({
    spaceId,
    envId: environmentId,
    envAliasId: environmentAliasId,
    contentType: internalContentType,
    entry: entryApi,
    field: fieldApi,
    user: userApi,
    widgetNamespace,
    widgetId,
  });

  const spaceApi = createSpaceApi({
    cma,
    initialContentTypes: contentTypes,
    pubSubClient,
    environmentIds: [environmentId, ...aliasesId],
    spaceId,
    tagsRepo: createTagsRepo(spaceEndpoint, environmentId),
    usersRepo,
    appId: idsApi.app,
  });

  const windowApi = {
    // There are no iframes in the internal API so any methods related
    // to <iframe> height can be safely ignored.
    updateHeight: noop,
    startAutoResizer: noop,
    stopAutoResizer: noop,
  };

  const baseSdk = createBaseExtensionSdk({
    parametersApi: parameters,
    spaceApi,
    spaceMember: space.data.spaceMember,
    locationApi,
    navigatorApi,
  });

  const sharedEditorSDK = createSharedEditorSDK({
    contentTypeApi,
    entryApi,
    editorApi,
  });

  const sdkWithoutDialogs: Omit<FieldExtensionSDK, 'dialogs'> = {
    ...baseSdk,
    ...sharedEditorSDK,
    ids: idsApi,
    field: fieldApi,
    window: windowApi,
  };

  // We don't want to leak entry specific information
  const sdkWithoutDialogsAndIds = {
    ...sdkWithoutDialogs,
    ids: omit(sdkWithoutDialogs.ids, ['entry', 'contentType', 'field']),
  };

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogsAndIds),
  };
}
