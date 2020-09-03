import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';

import { Document } from 'app/entity_editor/Document/typesDocument';
import { InternalContentType } from './createContentTypeApi';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { createTagsRepo } from 'features/content-tags';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { createEditorApi } from './createEditorApi';
import { createEntryApi } from './createEntryApi';
import { createSpaceApi } from './createSpaceApi';
import { createNavigatorApi } from './createNavigatorApi';
import { createDialogsApi } from './createDialogsApi';
import { createSharedFieldWidgetSDK } from './utils';

export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  spaceContext,
  $scope,
  doc,
  internalContentType,
  parameters,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  spaceContext: any;
  $scope: any;
  doc: Document;
  internalContentType: InternalContentType;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}): FieldExtensionSDK {
  const editorApi = createEditorApi({
    editorInterface: $scope.editorData.editorInterface,
    getLocaleData: () => $scope.localeData,
    getPreferences: () => $scope.preferences,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
  });

  const entryApi = createEntryApi({
    internalContentType,
    doc,
    fieldLocaleListeners: $scope.fieldLocaleListeners.lookup,
    // TODO: `setInvalid` is only available on `fieldController`. The SDK can only
    //   mark the current field as invalid. We could consider moving `setInvalid` to
    //   the field-locale level.
    setInvalid: (localeCode, isInvalid) => {
      if ($scope.fieldController) {
        return $scope.fieldController.setInvalid(localeCode, isInvalid);
      }
    },
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

  const sdkWithoutDialogs = {
    ...createSharedFieldWidgetSDK({
      entryApi,
      environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
      publicFieldId: fieldId,
      internalContentType,
      publicLocaleCode: localeCode,
      spaceId: spaceContext.getId(),
      spaceMember: spaceContext.space.data.spaceMember,
      widgetId,
      widgetNamespace,
      parameters,
    }),
    editor: editorApi,
    space: spaceApi,
    navigator: navigatorApi,
  };

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogs),
  };
}
