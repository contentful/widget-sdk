import { IdsAPI, UserAPI } from '@contentful/app-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

interface CreateIdsOptions {
  spaceId: string;
  envId: string;
  envAliasId: string | null;
  user: UserAPI;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createIdsApi = ({
  spaceId,
  envId,
  envAliasId,
  user,
  widgetNamespace,
  widgetId,
}: CreateIdsOptions): Omit<IdsAPI, 'field' | 'entry' | 'contentType'> => {
  return {
    space: spaceId,
    environment: envId,
    ...(typeof envAliasId === 'string' ? { environmentAlias: envAliasId } : {}),
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
