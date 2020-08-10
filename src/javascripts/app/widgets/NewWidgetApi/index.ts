import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi, createReadOnlyNavigatorApi } from './createNavigatorApi';
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
  EntryAPI,
  FieldExtensionSDK,
  NavigatorAPI,
  ParametersAPI,
  SharedEditorSDK,
  SpaceAPI,
} from 'contentful-ui-extensions-sdk';
import { createEditorApi } from './createEditorApi';
import { Widget, WidgetNamespace } from 'features/widget-renderer';
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

interface NonReadOnlyApis {
  editorApi: SharedEditorSDK['editor'];
  entryApi: EntryAPI;
  spaceApi: SpaceAPI;
  navigatorApi: NavigatorAPI;
  dialogsApi: DialogsAPI;
  parametersApi: ParametersAPI;
}

interface CreateSharedFieldWidgetSDKOptions {
  nonReadOnlyApis: NonReadOnlyApis;
  environmentIds: string[];
  publicFieldId: Field['id'] | Field['apiName'];
  internalContentType: ContentType;
  publicLocaleCode: Locale['code'];
  spaceId: string;
  spaceMember: SpaceMember;
  widgetId: Widget['id'];
  widgetNamespace: WidgetNamespace;
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
  const entryApi = createEntryApi({
    internalContentType: internalContentType,
    otDoc,
    setInvalid: noop,
    listenToFieldLocaleEvent: (_internalField, _locale, _extractFieldLocaleProperty, _cb) => noop,
    readOnly: true,
  });
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
  const navigatorApi = createReadOnlyNavigatorApi();
  const dialogsApi = createReadOnlyDialogsApi();

  return createSharedFieldWidgetSDK({
    nonReadOnlyApis: {
      editorApi,
      entryApi,
      spaceApi,
      navigatorApi,
      dialogsApi,
      parametersApi: {
        installation: {},
        instance: {},
      },
    },
    environmentIds,
    publicFieldId: field.apiName ?? field.id,
    internalContentType,
    publicLocaleCode: locale.code,
    spaceId,
    spaceMember,
    widgetId,
    widgetNamespace,
  });
}

function createSharedFieldWidgetSDK({
  nonReadOnlyApis,
  environmentIds,
  publicFieldId,
  internalContentType,
  publicLocaleCode,
  spaceId,
  spaceMember,
  widgetId,
  widgetNamespace,
}: CreateSharedFieldWidgetSDKOptions): FieldExtensionSDK {
  const [environmentId] = environmentIds;
  const {
    editorApi,
    entryApi,
    spaceApi,
    navigatorApi,
    dialogsApi,
    parametersApi,
  } = nonReadOnlyApis;

  const contentTypeApi = createContentTypeApi(internalContentType);

  const fieldApi = entryApi.fields[publicFieldId].getForLocale(publicLocaleCode);
  const accessApi = createAccessApi();
  const notifierApi = Notification;
  const localesApi = createLocalesApi();

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

  return {
    contentType: contentTypeApi,
    entry: entryApi,
    field: fieldApi,
    parameters: parametersApi,
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
    dialogs: dialogsApi,
  };
}
