import { Document } from 'app/entity_editor/Document/typesDocument';
import { createContentTypeApi, InternalContentType } from '../createContentTypeApi';
import { createDialogsApi } from '../createDialogsApi';
import { createEditorApi } from '../createEditorApi';
import { createEntryApi } from '../createEntryApi';
import { createIdsApiWithoutField } from '../utils';
import { WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createUserApi, SpaceMember } from '../createUserApi';
import { createNavigatorApi } from '../createNavigatorApi';
import { noop } from 'lodash';
import { createSpaceApi } from '../createSpaceApi';
import { createTagsRepo } from 'features/content-tags';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { SidebarExtensionSDK } from 'contentful-ui-extensions-sdk';
import { createBaseExtensionSdk } from '../createBaseExtensionSdk';
import { createSharedEditorSDK } from '../createSharedEditorSDK';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';

interface CreateSidebarWidgetSDKOptions {
  internalContentType: InternalContentType;
  $scope: any;
  doc: Document;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  spaceContext: any;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  fieldLocaleListeners: { lookup: FieldLocaleLookup };
}

export const createSidebarWidgetSDK = ({
  internalContentType,
  $scope,
  doc,
  parameters,
  spaceContext,
  widgetNamespace,
  widgetId,
  fieldLocaleListeners,
}: CreateSidebarWidgetSDKOptions): SidebarExtensionSDK => {
  const contentTypeApi = createContentTypeApi(internalContentType);
  const editorApi = createEditorApi({
    editorInterface: $scope.editorData.editorInterface,
    getLocaleData: () => $scope.localeData,
    getPreferences: () => $scope.preferences,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
  });

  const entryApi = createEntryApi({
    internalContentType,
    doc,
    fieldLocaleListeners: fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController` of a current
    // field, but in context of sidebar there is no current field. We should move
    // it to field-locale level in a long run.
    setInvalid: noop,
  });

  const userApi = createUserApi(spaceContext.space.data.spaceMember as SpaceMember);

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
    cma: getBatchingApiClient(spaceContext.cma),
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId(),
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
    usersRepo: spaceContext.users,
  });

  const navigatorApi = createNavigatorApi({ spaceContext, widgetNamespace, widgetId });

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

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogs),
  };
};
