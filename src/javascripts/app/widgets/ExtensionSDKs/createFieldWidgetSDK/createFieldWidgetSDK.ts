import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { InternalContentType, createContentTypeApi } from '../createContentTypeApi';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { createTagsRepo } from 'features/content-tags';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
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

export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  spaceContext,
  editorData,
  localeData,
  preferences,
  fieldController,
  doc,
  internalContentType,
  fieldLocaleListeners,
  parameters,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  spaceContext: any;
  editorData: any;
  localeData: any;
  preferences: any;
  fieldController: any;
  doc: Document;
  internalContentType: InternalContentType;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}): FieldExtensionSDK {
  const editorApi = createEditorApi({
    editorInterface: editorData.editorInterface,
    getLocaleData: () => localeData,
    getPreferences: () => preferences,
  });

  const contentTypeApi = createContentTypeApi(internalContentType);

  const entryApi = createEntryApi({
    internalContentType,
    doc,
    fieldLocaleListeners: fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController`. The SDK can only
    //   mark the current field as invalid. We could consider moving `setInvalid` to
    //   the field-locale level.
    setInvalid: (localeCode, isInvalid) => {
      if (fieldController) {
        return fieldController.setInvalid(localeCode, isInvalid);
      }
    },
  });

  const navigatorApi = createNavigatorApi({ spaceContext, widgetNamespace, widgetId });

  const locationApi = {
    is: (location: string) => location === WidgetLocation.ENTRY_FIELD,
  };

  const fieldApi = entryApi.fields[fieldId].getForLocale(localeCode);

  const userApi = createUserApi(spaceContext.space.data.spaceMember);

  const idsApi = createIdsApi({
    spaceId: spaceContext.getId(),
    envId: spaceContext.getEnvironmentId(),
    envAliasId: spaceContext.getAliasId(),
    contentType: internalContentType,
    entry: entryApi,
    field: fieldApi,
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
    appId: idsApi.app
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
    spaceMember: spaceContext.space.data.spaceMember,
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
