import { ContentType, FieldAPI, IdsAPI, User, EntryAPI } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

interface CreateIdsOptions {
  spaceId: string;
  envId: string;
  envAliasId: string | null | undefined;
  contentType: ContentType;
  entry: EntryAPI;
  field: FieldAPI;
  user: User;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createIdsApi = ({
  spaceId,
  envId,
  envAliasId,
  contentType,
  entry,
  field,
  user,
  widgetNamespace,
  widgetId,
}: CreateIdsOptions): IdsAPI => {
  return {
    space: spaceId,
    environment: envId,
    ...(typeof envAliasId === 'string' ? { environmentAlias: envAliasId } : {}),
    contentType: contentType.sys.id,
    entry: entry.getSys().id,
    field: field.id,
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
