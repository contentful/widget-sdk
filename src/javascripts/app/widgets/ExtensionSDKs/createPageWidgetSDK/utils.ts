import { IdsAPI, User } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

// TODO: Once the SDK types are updated use them directly.
type IdsApiWithAlias = Omit<IdsAPI, 'field' | 'entry' | 'contentType'> & {
  environmentAlias?: string;
};

interface CreateIdsOptions {
  spaceId: string;
  envId: string;
  envAliasId: string | null;
  user: User;
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
}: CreateIdsOptions): IdsApiWithAlias => {
  return {
    space: spaceId,
    environment: envId,
    ...(typeof envAliasId === 'string' ? { environmentAlias: envAliasId } : {}),
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
