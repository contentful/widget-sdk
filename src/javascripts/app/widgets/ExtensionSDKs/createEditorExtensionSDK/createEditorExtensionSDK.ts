import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
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

interface CreateEditorExtensionSDKOptions {
  internalContentType: InternalContentType;
  doc: Document;
  spaceContext: any;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
  $scope: any;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createEditorExtensionSDK = ({
  $scope,
  spaceContext,
  internalContentType,
  widgetNamespace,
  widgetId,
  parameters,
  doc,
}: CreateEditorExtensionSDKOptions): EditorExtensionSDK => {
  const contentTypeApi = createContentTypeApi(internalContentType);

  const editorApi = createEditorApi({
    editorInterface: $scope.editorData.editorInterface,
    getLocaleData: () => $scope.localeData,
    getPreferences: () => $scope.preferences,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
  });

  const userApi = createUserApi(spaceContext.space.data.spaceMember as SpaceMember);

  const entryApi = createEntryApi({
    internalContentType,
    doc,
    fieldLocaleListeners: $scope.fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController` of a current
    // field, but in context of editor there is no current field. We should move
    // it to field-locale level in a long run.
    setInvalid: noop,
  });

  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(spaceContext.cma),
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId(),
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
    usersRepo: spaceContext.users,
  });

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
    is: (location: string) => location === WidgetLocation.ENTRY_EDITOR,
  };

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
