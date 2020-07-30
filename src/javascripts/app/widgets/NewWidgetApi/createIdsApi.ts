import { ContentType, FieldAPI, IdsAPI, User, EntryAPI } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from 'features/widget-renderer';

export const createIdsApi = (
  spaceId: string,
  envId: string,
  contentType: ContentType,
  entry: EntryAPI,
  field: FieldAPI,
  user: User,
  widgetNamespace: WidgetNamespace,
  widgetId: string
): IdsAPI => {
  return {
    space: spaceId,
    environment: envId,
    contentType: contentType.sys.id,
    entry: entry.getSys().id,
    field: field.id,
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
