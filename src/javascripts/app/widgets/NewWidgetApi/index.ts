import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi, createReadOnlyDialogsApi } from './createDialogsApi';
import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { createUserApi, SpaceMember } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { createEntryApi } from './createEntryApi';
import {
  ContentType,
  DialogExtensionSDK,
  DialogsAPI,
  FieldExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import { createEditorApi } from './createEditorApi';
import { WidgetNamespace } from 'features/widget-renderer';
import { createAccessApi } from './createAccessApi';
import { makeFieldLocaleEventListener } from './createEntryFieldApi';
import { Document } from 'app/entity_editor/Document/typesDocument';

import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Entry } from 'contentful-management/dist/typings/entities/entry';

import localeStore from 'services/localeStore';
import { create } from 'app/entity_editor/Document/CmaDocument';
import { Entity } from 'app/entity_editor/Document/types';
import { create as createEntityRepo } from '../../../data/CMA/EntityRepo';
import { PubSubClient } from '../../../services/PubSubService';
import { EditorInterface } from '../../../features/widget-renderer/interfaces';
import { SpaceEndpoint } from '../../../data/CMA/types';

// TODO: split in read-only + write
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
    otDoc,
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
  const dialogs = createDialogsApi({ sdk: sdkForDialogs });
  sdkForDialogs.dialogs = dialogs;

  return {
    ...sdkWithoutDialogs,
    dialogs,
  };
}

interface CreateReadOnlyFieldWidgetSDKOptions {
  cma: any;
  editorInterface: EditorInterface;
  endpoint: SpaceEndpoint;
  entry: Entry;
  environmentIds: string[];
  field: Field;
  fieldValue: any;
  initialContentTypes: ContentType[];
  internalContentType: ContentType;
  locale: Locale;
  spaceId: string;
  spaceMember: SpaceMember;
  tagsRepo: any;
  usersRepo: any;
  widgetId: string;
  widgetNamespace: WidgetNamespace;
}

export function createReadonlyFieldWidgetSDK({
  cma,
  editorInterface,
  endpoint,
  entry,
  environmentIds,
  field, // TODO: should this be replaced with publicFieldId?
  initialContentTypes,
  internalContentType,
  locale, // TODO: should this be replaced by the code?
  spaceId,
  spaceMember,
  tagsRepo,
  usersRepo,
  widgetId,
  widgetNamespace,
}: CreateReadOnlyFieldWidgetSDKOptions): FieldExtensionSDK {
  const pubSubClient = { on: noop, off: noop } as PubSubClient;
  const [environmentId] = environmentIds;

  const readOnlyEntityRepo = createEntityRepo(endpoint, pubSubClient, noop, {
    skipDraftValidation: true,
    skipTransformation: true,
    indicateAutoSave: false,
  });
  const otDoc: Document = create(
    {
      data: (entry as unknown) as Entity, // TODO: wtf
      setDeleted: noop,
    },
    internalContentType,
    readOnlyEntityRepo,
    5000
  );
  /// STUBS
  const publicFieldId = field.apiName ?? field.id;
  const publicLocaleCode = locale.code;
  /// END STUBS

  const contentTypeApi = createContentTypeApi(internalContentType);
  const entryApi = createEntryApi({
    internalContentType: internalContentType,
    otDoc,
    setInvalid: noop,
    listenToFieldLocaleEvent: (_internalField, _locale, _extractFieldLocaleProperty, _cb) => noop,
    readOnly: true,
  });
  const fieldApi = entryApi.fields[publicFieldId].getForLocale(publicLocaleCode);
  const accessApi = createAccessApi();
  const notifierApi = Notification;
  const localesApi = createLocalesApi();
  const spaceApi = createSpaceApi({
    cma: getBatchingApiClient(cma),
    initialContentTypes,
    pubSubClient,
    environmentIds,
    spaceId,
    tagsRepo,
    usersRepo,
    readOnly: true,
  });
  const userApi = createUserApi(spaceMember);
  const idsApi = createIdsApi(
    spaceId,
    environmentId,
    internalContentType,
    entryApi,
    fieldApi,
    userApi,
    widgetNamespace,
    widgetId
  );
  const locationApi = {
    // TODO: hardcoded! Use current location instead of "entry-field"
    is: (type: string) => type === 'entry-field',
  };
  const windowApi = {
    // There are no iframes in the internal API so any methods related
    // to <iframe> height can be safely ignored.
    updateHeight: noop,
    startAutoResizer: noop,
    stopAutoResizer: noop,
  };

  const navigatorApi = createNavigatorApi({
    spaceContext: null,
    widgetNamespace,
    widgetId,
    readOnly: true,
  });

  // "Editing" APIs
  const editorApi = createEditorApi({
    editorInterface: editorInterface,
    getLocaleData: () => {
      return {
        defaultLocale: localeStore.getDefaultLocale(),
        privateLocales: localeStore.getPrivateLocales(),
        focusedLocale: localeStore.getFocusedLocale(),
        isSingleLocaleModeOn: localeStore.isSingleLocaleModeOn(),
        isLocaleActive: localeStore.isLocaleActive,
      };
    },
    // TODO: the value of preferences.showDisabledFields doesn't seem to affect the snapshot view.
    //  Also, preferences.showDisabledFields is the only preference which seems to be used in the
    //  Editor API. Is it safe to assume this is useless and can be nooped?
    getPreferences: () => ({ showDisabledFields: true }),
    watch: (_watchFn, _cb) => noop,
  });

  const sdkWithoutDialogs = {
    contentType: contentTypeApi,
    entry: entryApi,
    field: fieldApi,
    parameters: {
      installation: {},
      instance: {},
    },
    access: accessApi,
    locales: localesApi,
    space: spaceApi,
    notifier: notifierApi,
    user: userApi,
    ids: idsApi,
    location: locationApi,
    window: windowApi,
    navigator: navigatorApi,
    editor: editorApi,
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
  const dialogs = createReadOnlyDialogsApi();
  sdkForDialogs.dialogs = dialogs;

  return {
    ...sdkWithoutDialogs,
    dialogs,
  };
}
