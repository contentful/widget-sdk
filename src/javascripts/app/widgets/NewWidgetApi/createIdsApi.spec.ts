import { createIdsApi } from './createIdsApi';
import { WidgetNamespace } from 'features/widget-renderer';

describe('createIdsApi', () => {
  const spaceId = 'space_id';
  const envId = 'env_id';
  const entry = {
    getSys: jest.fn(() => ({ id: 'entry_id' })),
  };
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
      const result = createIdsApi(
        spaceId,
        envId,
        contentType,
        entry,
        { id: fieldId },
        user,
        WidgetNamespace.APP,
        widgetId
      );

      expect(result).toMatchObject({
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
      const result = createIdsApi(
        spaceId,
        envId,
        contentType,
        entry,
        { id: fieldId },
        user,
        WidgetNamespace.EXTENSION,
        widgetId
      );

      expect(result).toMatchObject({
        space: spaceId,
        environment: envId,
        contentType: 'content_type',
        entry: 'entry_id',
        field: fieldId,
        user: 'user_id',
        extension: widgetId,
      });
    });
  });
});
