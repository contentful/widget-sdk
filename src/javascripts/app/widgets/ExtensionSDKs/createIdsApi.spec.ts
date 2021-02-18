import { createIdsApi } from './createIdsApi';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { EntryAPI, FieldAPI, User } from '@contentful/app-sdk';

describe('createIdsApi', () => {
  const spaceId = 'space_id';
  const envId = 'env_id';
  const envAliasId = 'some_alias';
  const entry = ({
    getSys: jest.fn(() => ({ id: 'entry_id' })),
  } as unknown) as EntryAPI;
  const fieldId = 'field_id';
  const user = {
    sys: {
      id: 'user_id',
    },
  };
  const widgetId = 'widget_id';

  const contentType = {
    sys: {
      type: 'Symbol',
      id: 'content_type',
    },
    fields: [],
    name: 'my_content_type',
    displayField: '',
    description: '',
  };

  describe('for an app', () => {
    it('returns an object with the ids', () => {
      const result = createIdsApi({
        spaceId,
        envId,
        envAliasId,
        contentType,
        entry,
        field: ({ id: fieldId } as unknown) as FieldAPI,
        user: user as User,
        widgetNamespace: WidgetNamespace.APP,
        widgetId,
      });

      expect(result).toStrictEqual({
        space: spaceId,
        environment: envId,
        environmentAlias: envAliasId,
        contentType: 'content_type',
        entry: 'entry_id',
        field: fieldId,
        user: 'user_id',
        app: widgetId,
      });
    });

    it('skips environment alias if not provided', () => {
      const result = createIdsApi({
        spaceId,
        envId,
        envAliasId: null,
        contentType,
        entry,
        field: ({ id: fieldId } as unknown) as FieldAPI,
        user: user as User,
        widgetNamespace: WidgetNamespace.APP,
        widgetId,
      });

      expect(result).toStrictEqual({
        space: spaceId,
        environment: envId,
        contentType: 'content_type',
        entry: 'entry_id',
        field: fieldId,
        user: 'user_id',
        app: widgetId,
      });
    });
  });

  describe('for an extension', () => {
    it('returns an object with the ids', () => {
      const result = createIdsApi({
        spaceId,
        envId,
        envAliasId,
        contentType,
        entry,
        field: { id: fieldId } as FieldAPI,
        user: user as User,
        widgetNamespace: WidgetNamespace.EXTENSION,
        widgetId,
      });

      expect(result).toStrictEqual({
        space: spaceId,
        environment: envId,
        environmentAlias: envAliasId,
        contentType: 'content_type',
        entry: 'entry_id',
        field: fieldId,
        user: 'user_id',
        extension: widgetId,
      });
    });
  });
});
