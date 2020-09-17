import { IdsAPI, User } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

interface CreateIdsApiProps {
  spaceId: string;
  envId: string;
  user: User;
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

export const createIdsApi = ({
  spaceId,
  envId,
  user,
  widgetNamespace,
  widgetId,
}: CreateIdsApiProps): Omit<IdsAPI, 'field' | 'entry' | 'contentType'> => {
  return {
    space: spaceId,
    environment: envId,
    user: user.sys.id,
    // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
    [widgetNamespace]: widgetId,
  };
};
