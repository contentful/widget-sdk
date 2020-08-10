import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import { createSpaceApi } from './createSpaceApi';
import { InternalContentType, createContentTypeApi } from './createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { createUserApi } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { createEntryApi } from './createEntryApi';
import { FieldExtensionSDK, DialogExtensionSDK, DialogsAPI } from 'contentful-ui-extensions-sdk';
import { createEditorApi } from './createEditorApi';
import { WidgetNamespace } from 'features/widget-renderer';
import { createAccessApi } from './createAccessApi';
import { makeFieldLocaleEventListener } from './createEntryFieldApi';
import { Document } from 'app/entity_editor/Document/typesDocument';

export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  editorInterfaceSettings = {},
  spaceContext,
  $scope,
  doc,
  internalContentType,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  editorInterfaceSettings?: Record<string, any>;
  spaceContext: any;
  $scope: any;
  doc: Document;
  internalContentType: InternalContentType;
}): FieldExtensionSDK {
  // "Editing" APIs
  const editor = createEditorApi({
    editorInterface: $scope.editorData.editorInterface,
    getLocaleData: () => $scope.localeData,
    getPreferences: () => $scope.preferences,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
  });
  const contentType = createContentTypeApi(internalContentType);
  const entry = createEntryApi({
    internalContentType,
    doc,
    // TODO: `setInvalid` is only available on `fieldController`. The SDK can only
    // mark the current field as invalid. We could consider moving `setInvalid` to
    // the field-locale level.
    setInvalid: (localeCode, isInvalid) => $scope.fieldController.setInvalid(localeCode, isInvalid),
    listenToFieldLocaleEvent: makeFieldLocaleEventListener($scope),
  });
  const field = entry.fields[fieldId].getForLocale(localeCode);

  // "Space-level" APIs
  const locales = createLocalesApi();
  const space = createSpaceApi({
    cma: getBatchingApiClient(spaceContext.cma),
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
    spaceId: spaceContext.getId(),
    tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
    usersRepo: spaceContext.users,
  });

  // "Static data" APIs
  const user = createUserApi(spaceContext.space.data.spaceMember);
  const ids = createIdsApi(
    spaceContext.getId(),
    spaceContext.getEnvironmentId(),
    contentType,
    entry,
    field,
    user,
    widgetNamespace,
    widgetId
  );
  const parameters = {
    installation: {},
    instance: editorInterfaceSettings,
  };

  // "Utility" APIs
  const navigator = createNavigatorApi({ spaceContext, widgetNamespace, widgetId });
  const notifier = Notification;
  const access = createAccessApi();

  const location = {
    // TODO: hardcoded! Use current location instead of "entry-field"
    is: (type: string) => type === 'entry-field',
  };

  const window = {
    // There are no iframes in the internal API so any methods related
    // to <iframe> height can be safely ignored.
    updateHeight: noop,
    startAutoResizer: noop,
    stopAutoResizer: noop,
  };

  const sdkWithoutDialogs: Omit<FieldExtensionSDK, 'dialogs'> = {
    editor,
    contentType,
    entry,
    field,
    locales,
    space,
    user,
    ids,
    parameters,
    navigator,
    notifier,
    access,
    location,
    window,
  };

  const sdkForDialogs: DialogExtensionSDK = {
    ...sdkWithoutDialogs,
    // We cannot create dialogs API w/o full SDK including dialog methods.
    // The reason is that we can open dialogs from dialogs. Empty "dialogs"
    // namespace is replaced once the APIs are created with the same instance
    // of the SDK. See passing `sdkForDialogs` by reference and assignment to
    // the "dialogs" namespace later on.
    dialogs: ({} as unknown) as DialogsAPI,
    // Again, we cannot determine what closing a dialog means in this context.
    // Implementation needs to be provided closer to the `ModalLauncher`.
    close: () => {
      throw new Error('close() implementation needs to be provided in createDialogsApi');
    },
  };
  const dialogs = createDialogsApi(sdkForDialogs);
  sdkForDialogs.dialogs = dialogs;

  return {
    ...sdkWithoutDialogs,
    dialogs,
  };
}

// TODO: sync with regular API and make sure it's really read only,
// including CMA operations via the space API
export function createReadonlyFieldWidgetSDK() {
  return {};
}
