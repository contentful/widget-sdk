import { ContentType, EntryAPI, UserAPI, IdsAPI } from '@contentful/app-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { getUserSync } from 'services/TokenStore';

interface CreateIdsApiProps {
  spaceId: string;
  envId: string;
  envAliasId: string | undefined;
  contentType: ContentType;
  entry: EntryAPI;
  user: UserAPI;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createIdsApiWithoutField = ({
  spaceId,
  envId,
  envAliasId,
  contentType,
  entry,
  user,
  widgetNamespace,
  widgetId,
}: CreateIdsApiProps): Omit<IdsAPI, 'field'> => {
  return {
    space: spaceId,
    environment: envId,
    ...(typeof envAliasId === 'string' ? { environmentAlias: envAliasId } : {}),
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

export function serializeJSONValue(value: unknown): Promise<SerializedJSONValue | undefined> {
  return Promise.resolve(getSerializeJSONValue(value));
}
export function getSerializeJSONValue(value: unknown): SerializedJSONValue | undefined {
  if (typeof value === 'undefined') {
    return;
  }

  if (Array.isArray(value)) {
    return value.map((v) => getSerializeJSONValue(v) ?? null);
  } else if (value === null) {
    return null;
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (typeof value === 'object' && !!value) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, v]) => [key, getSerializeJSONValue(v)])
        .filter(([, v]) => v !== undefined)
    );
  } else {
    return value as string | number | boolean;
  }
}

/**
 * Minifies the users sys object with only id and type
 */

export function getUserWithMinifiedSys() {
  const { sys, ...restOfUser } = getUserSync();
  const { id, type } = sys;
  return {
    sys: { id, type },
    ...restOfUser,
  };
}
