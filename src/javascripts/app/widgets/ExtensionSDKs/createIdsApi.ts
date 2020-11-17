import { ContentType, FieldAPI, IdsAPI, User, EntryAPI } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

// TODO: Once the SDK types are updated use them directly.
type IdsApiWithAlias = IdsAPI & { environmentAlias?: string };

interface CreateIdsOptions {
  spaceId: string;
  envId: string;
  envAliasId: string | null;
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
}: CreateIdsOptions): IdsApiWithAlias => {
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
