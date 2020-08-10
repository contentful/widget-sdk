import {
  DialogsAPI,
  EntryAPI,
  FieldExtensionSDK,
  NavigatorAPI,
  ParametersAPI,
  SharedEditorSDK,
  SpaceAPI,
} from 'contentful-ui-extensions-sdk';
import { createContentTypeApi, InternalContentType } from './createContentTypeApi';
import { createAccessApi } from './createAccessApi';
import { Notification } from '@contentful/forma-36-react-components';
import { createLocalesApi } from './createLocalesApi';
import { createUserApi, SpaceMember } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { noop } from 'lodash';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Widget, WidgetNamespace } from 'features/widget-renderer';

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
  internalContentType: InternalContentType;
  publicLocaleCode: Locale['code'];
  spaceId: string;
  spaceMember: SpaceMember;
  widgetId: Widget['id'];
  widgetNamespace: WidgetNamespace;
}

export function createSharedFieldWidgetSDK({
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
