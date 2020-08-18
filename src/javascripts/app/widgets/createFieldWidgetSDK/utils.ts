import { FieldExtensionSDK, EntryAPI } from 'contentful-ui-extensions-sdk';
import { createContentTypeApi, InternalContentType } from './createContentTypeApi';
import { createAccessApi } from './createAccessApi';
import { Notification } from '@contentful/forma-36-react-components';
import { createLocalesApi } from './createLocalesApi';
import { createUserApi, SpaceMember } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { noop } from 'lodash';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { Widget, WidgetNamespace, WidgetLocation } from 'features/widget-renderer';

interface CreateSharedFieldWidgetSDKOptions {
  entryApi: EntryAPI;
  environmentIds: string[];
  publicFieldId: Field['id'] | Field['apiName'];
  internalContentType: InternalContentType;
  publicLocaleCode: Locale['code'];
  spaceId: string;
  spaceMember: SpaceMember;
  widgetId: Widget['id'];
  widgetNamespace: WidgetNamespace;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

export function createSharedFieldWidgetSDK({
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
}: CreateSharedFieldWidgetSDKOptions): Omit<
  FieldExtensionSDK,
  'editor' | 'space' | 'navigator' | 'dialogs'
> {
  const [environmentId] = environmentIds;
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
    is: (location: string) => location === WidgetLocation.ENTRY_FIELD,
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
    parameters,
    access: accessApi,
    locales: localesApi,
    notifier: notifierApi,
    user: userApi,
    ids: idsApi,
    location: locationApi,
    window: windowApi,
  };
}
