import { ContentType, EntryAPI, User, IdsAPI } from '@contentful/app-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

interface CreateIdsApiProps {
  spaceId: string;
  envId: string;
  contentType: ContentType;
  entry: EntryAPI;
  user: User;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createIdsApiWithoutField = ({
  spaceId,
  envId,
  contentType,
  entry,
  user,
  widgetNamespace,
  widgetId,
}: CreateIdsApiProps): Omit<IdsAPI, 'field'> => {
  return {
    space: spaceId,
    environment: envId,
    contentType: contentType.sys.id,
    entry: entry.getSys().id,
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
