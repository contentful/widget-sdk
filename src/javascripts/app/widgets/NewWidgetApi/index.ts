import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
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
  SpaceAPI,
} from 'contentful-ui-extensions-sdk';
import { createEditorApi } from './createEditorApi';
import { WidgetNamespace } from 'features/widget-renderer';
import { createAccessApi } from './createAccessApi';
import { makeFieldLocaleEventListener } from './createEntryFieldApi';

import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Entry } from 'contentful-management/dist/typings/entities/entry';

import { Document } from 'app/entity_editor/Document/typesDocument';
import localeStore from 'services/localeStore';

// TODO: split in read-only + write
export function createFieldWidgetSDK({
  fieldId,
  localeCode,
  widgetNamespace,
  widgetId,
  editorInterfaceSettings = {},
  spaceContext,
  $scope,
  internalContentType,
}: {
  fieldId: string;
  localeCode: string;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  editorInterfaceSettings?: Record<string, any>;
  spaceContext: any;
  $scope: any;
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
    otDoc: $scope.otDoc,
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
// export async function createReadonlyFieldWidgetSDK(opts: any) {
//   const { cma, locale, initialContentTypes, entry } = opts;
//
//   const parameters = await cma.getExtension();
//
//   // TODO: should we get this from the outside?
//   const currentContentType = initialContentTypes.find(
//     (i) => i.sys.id === entry.sys.contentType.sys.id
//   );
//
//   const contentType = createContentTypeApi(currentContentType);
//   const locales = createLocalesApi();
//
//   // "Editing" APIs
//   const editor = createEditorApi({
//     editorInterface: await cma.getEditorInterface(),
//     getLocaleData: (): LocaleData => {
//       return {
//         // TODO: cannot use locale api, because it returns locale code, not locale object
//         defaultLocale: localeStore.getDefaultLocale(),
//         privateLocales: localeStore.getPrivateLocales(),
//         focusedLocale: localeStore.getFocusedLocale(),
//         isSingleLocaleModeOn: localeStore.isSingleLocaleModeOn(),
//         isLocaleActive: localeStore.isLocaleActive,
//       };
//     },
//     getPreferences: () => {
//       return {};
//     },
//     watch: (_watchFn, _cb) => noop,
//   });
//
//   return {
//     parameters: {},
//     contentType,
//     editor,
//     locales,
//     dialogs: {},
//     field: {},
//     space: {},
//   };
// }

interface CreateReadOnlyFieldWidgetSDKOptions {
  field: Field;
  locale: Locale;
  fieldValue: any;
  internalContentType: ContentType;
  entry: Entry;
  initialContentTypes: ContentType[];
  cma: any;
}

export async function createReadonlyFieldWidgetSDK({
  field, // TODO: should this be replaced with publicFieldId?
  locale, // TODO: should this be replaced by the code?
  fieldValue,
  internalContentType,
  entry,
  initialContentTypes,
  cma,
}: CreateReadOnlyFieldWidgetSDKOptions): Promise<FieldExtensionSDK> {
  /// STUBS
  const otDoc: Document = {
    changes: undefined,
    data$: undefined,
    permissions: {
      can: function (p1: string) {
        return false;
      },
      canEditFieldLocale: function (p1: string, p2: string) {
        return false;
      },
    },
    presence: {
      collaborators: undefined,
      collaboratorsFor: function () {
        return undefined;
      },
      destroy: function () {},
      focus: function (p1: string, p2: string) {},
      leave: function () {},
    },
    resourceState: undefined,
    state: {
      canEdit$: undefined,
      error$: undefined,
      isConnected$: undefined,
      isDirty$: undefined,
      isSaving$: undefined,
      loaded$: undefined,
    },
    sysProperty: undefined,
    destroy(): void {},
    getValueAt(path: Path): any {},
    getVersion(): number {
      return 0;
    },
    insertValueAt(path: Path, i: number, value: any): Promise<Entity> {
      return Promise.resolve(undefined);
    },
    pushValueAt(path: Path, value: any): Promise<Entity> {
      return Promise.resolve(undefined);
    },
    removeValueAt(path: Path): Promise<void> {
      return Promise.resolve(undefined);
    },
    setValueAt(path: Path, value: any): Promise<Entity> {
      return Promise.resolve(undefined);
    },
  }; // Todo: implement readonly otDoc
  const contentTypeApi = createContentTypeApi(internalContentType);
  const publicFieldId = field.apiName ?? field.id;
  const publicLocaleCode = locale.code;
  const spaceContext = {
    space: {
      data: {
        spaceMember: {} as SpaceMember,
      },
    },
  }; // TODO: implement read only space context

  /// END STUBS

  const entryApi = createEntryApi({
    internalContentType: internalContentType,
    otDoc,
    setInvalid: noop,
    listenToFieldLocaleEvent: (_internalField, _locale, _extractFieldLocaleProperty, _cb) => noop,
  });
  const fieldApi = entryApi.fields[publicFieldId].getForLocale(publicLocaleCode);
  const accessApi = createAccessApi();
  const notifierApi = Notification;
  const localesApi = createLocalesApi();
  const spaceApi = {} as SpaceAPI; //TODO: implement after read only space context
  const userApi = createUserApi(spaceContext.space.data.spaceMember);
  const idsApi = createIdsApi(
    cma.spaceId,
    cma.envId,
    internalContentType,
    entryApi,
    fieldApi,
    userApi,
    WidgetNamespace.BUILTIN, // WidgetNamespace
    '' // widgetId
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
    spaceContext,
    widgetNamespace: WidgetNamespace.BUILTIN,
    widgetId: '',
  });
  // "Editing" APIs
  const editorApi = createEditorApi({
    // TODO: try to not fetch this
    editorInterface: await cma.getEditorInterface(),
    getLocaleData: () => {
      return {
        // TODO: cannot use locale api, because it returns locale code, not locale object
        defaultLocale: localeStore.getDefaultLocale(),
        privateLocales: localeStore.getPrivateLocales(),
        focusedLocale: localeStore.getFocusedLocale(),
        isSingleLocaleModeOn: localeStore.isSingleLocaleModeOn(),
        isLocaleActive: localeStore.isLocaleActive,
      };
    },
    getPreferences: () => {
      return {};
    },
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
  const dialogs = createDialogsApi(sdkForDialogs);
  sdkForDialogs.dialogs = dialogs;

  return {
    ...sdkWithoutDialogs,
    dialogs,
  };
}
