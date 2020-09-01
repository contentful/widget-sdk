import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { noop } from 'lodash';

import { EditorInterface, WidgetNamespace } from '@contentful/widget-renderer';
import { SpaceEndpoint } from 'data/CMA/types';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';
import { PubSubClient } from 'services/PubSubService';
import localeStore from 'services/localeStore';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { create } from 'app/entity_editor/Document/CmaDocument';
import { Entity } from 'app/entity_editor/Document/types';

import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { createEditorApi } from './createEditorApi';
import { createEntryApi } from './createEntryApi';
import { createSpaceApi } from './createSpaceApi';
import { createReadOnlyNavigatorApi } from './createNavigatorApi';
import { createReadOnlyDialogsApi } from './createDialogsApi';
import { SpaceMember } from './createUserApi';
import { createSharedFieldWidgetSDK } from './utils';
import { InternalContentType } from './createContentTypeApi';

interface CreateReadOnlyFieldWidgetSDKOptions {
  cma: any;
  editorInterface: EditorInterface;
  endpoint: SpaceEndpoint;
  entry: Entity;
  environmentIds: string[];
  publicFieldId: Field['id'] | Field['apiName'];
  fieldValue: any;
  initialContentTypes: InternalContentType[];
  internalContentType: InternalContentType;
  publicLocaleCode: Locale['code'];
  spaceId: string;
  spaceMember: SpaceMember;
  tagsRepo: any;
  usersRepo: any;
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

export function createReadonlyFieldWidgetSDK({
  cma,
  editorInterface,
  endpoint,
  entry,
  environmentIds,
  publicFieldId,
  initialContentTypes,
  internalContentType,
  publicLocaleCode,
  spaceId,
  spaceMember,
  tagsRepo,
  usersRepo,
  widgetId,
  widgetNamespace,
  parameters,
}: CreateReadOnlyFieldWidgetSDKOptions): FieldExtensionSDK {
  const pubSubClient = { on: noop, off: noop } as PubSubClient;
  const readOnlyEntityRepo = createEntityRepo(endpoint, pubSubClient, noop, {
    skipDraftValidation: true,
    skipTransformation: true,
    indicateAutoSave: false,
  });
  const doc: Document = create(
    {
      data: entry,
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
    doc,
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

  return {
    ...createSharedFieldWidgetSDK({
      entryApi,
      environmentIds,
      publicFieldId,
      internalContentType,
      publicLocaleCode,
      spaceId,
      spaceMember,
      widgetId,
      widgetNamespace,
      parameters,
    }),
    editor: editorApi,
    space: spaceApi,
    navigator: navigatorApi,
    dialogs: dialogsApi,
  };
}
