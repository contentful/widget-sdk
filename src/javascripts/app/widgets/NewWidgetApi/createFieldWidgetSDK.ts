import {
  ContentType,
  DialogExtensionSDK,
  DialogsAPI,
  FieldExtensionSDK,
} from 'contentful-ui-extensions-sdk';

import { Document } from 'app/entity_editor/Document/typesDocument';
import { WidgetNamespace } from 'features/widget-renderer';
import { createTagsRepo } from 'features/content-tags';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { createEditorApi } from './createEditorApi';
import { createEntryApi } from './createEntryApi';
import { makeFieldLocaleEventListener } from './createEntryFieldApi';
import { createSpaceApi } from './createSpaceApi';
import { createNavigatorApi } from './createNavigatorApi';
import { createDialogsApi } from './createDialogsApi';
import { createSharedFieldWidgetSDK } from './utils';

export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  editorInterfaceSettings = {},
  spaceContext,
  $scope,
  otDoc,
  internalContentType,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  editorInterfaceSettings?: Record<string, any>;
  spaceContext: any;
  $scope: any;
  otDoc: Document;
  internalContentType: ContentType;
}): FieldExtensionSDK {
  const editorApi = createEditorApi({
    editorInterface: $scope.editorData.editorInterface,
    getLocaleData: () => $scope.localeData,
    getPreferences: () => $scope.preferences,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
  });

  const entryApi = createEntryApi({
    internalContentType,
    otDoc,
    // TODO: `setInvalid` is only available on `fieldController`. The SDK can only
    //   mark the current field as invalid. We could consider moving `setInvalid` to
    //   the field-locale level.
    setInvalid: (localeCode, isInvalid) => $scope.fieldController.setInvalid(localeCode, isInvalid),
    listenToFieldLocaleEvent: makeFieldLocaleEventListener($scope),
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

  const navigatorApi = createNavigatorApi({ spaceContext, widgetNamespace, widgetId });

  // We cannot create dialogs API w/o full SDK including dialog methods.
  // The reason is that we can open dialogs from dialogs. Empty "dialogs"
  // namespace is replaced once the APIs are created with the same instance
  // of the SDK. See passing `sdkForDialogs` by reference and assignment to
  // the "dialogs" namespace later on.
  const dialogsApi = ({} as unknown) as DialogsAPI;

  const sdkWithoutDialogs = createSharedFieldWidgetSDK({
    nonReadOnlyApis: {
      editorApi,
      entryApi,
      spaceApi,
      navigatorApi,
      dialogsApi,
      parametersApi: {
        installation: {},
        instance: editorInterfaceSettings,
      },
    },
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    publicFieldId: fieldId,
    internalContentType,
    publicLocaleCode: localeCode,
    spaceId: spaceContext.getId(),
    spaceMember: spaceContext.space.data.spaceMember,
    widgetId,
    widgetNamespace,
  });

  const sdkForDialogs: DialogExtensionSDK = {
    ...sdkWithoutDialogs,
    // Again, we cannot determine what closing a dialog means in this context.
    // Implementation needs to be provided closer to the `ModalLauncher`.
    close: () => {
      throw new Error('close() implementation needs to be provided in createDialogsApi');
    },
  };
  const dialogs = createDialogsApi({ sdk: sdkForDialogs });
  sdkForDialogs.dialogs = dialogs;

  return {
    ...sdkWithoutDialogs,
    dialogs,
  };
}
