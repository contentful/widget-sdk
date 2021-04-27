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

type SerializedJSONValue =
  | null
  | string
  | number
  | boolean
  | Array<SerializedJSONValue>
  | { [key: string]: SerializedJSONValue };

/**
 * - removes object props with undefined value
 * - replaces array undefined array values with null
 * - replaces Date objects with ISO strings
 */
export function serializeJSONValue(value: unknown): SerializedJSONValue | undefined {
  if (typeof value === 'undefined') {
    return;
  }

  if (Array.isArray(value)) {
    return value.map((v) => serializeJSONValue(v) ?? null);
  } else if (value === null) {
    return null;
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (typeof value === 'object' && !!value) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, v]) => [key, serializeJSONValue(v)])
        .filter(([, v]) => v !== undefined)
    );
  } else {
    return value as string | number | boolean;
  }
}
