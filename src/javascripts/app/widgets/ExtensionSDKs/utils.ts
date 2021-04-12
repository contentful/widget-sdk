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

/**
 * - removes object props with undefined value
 * - replaces array undefined array values with null
 */
export function cleanupJSONValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((v) => (v === undefined ? null : cleanupJSONValue(v)));
  } else if (value === null) {
    return null;
  } else if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([key, v]) => [key, cleanupJSONValue(v)])
    );
  } else {
    return value;
  }
}
