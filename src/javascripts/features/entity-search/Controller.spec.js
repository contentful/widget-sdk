import { createSearchController } from './Controller';
import { ListQuery } from 'core/services/ContentQuery';
import * as Paginator from 'classes/Paginator';
import { waitFor } from '@testing-library/react';
import Forma from '@contentful/forma-36-react-components';

jest.mock('@contentful/forma-36-react-components', () => ({}));

jest.mock('core/NgRegistry', () => ({
  getModule: jest.fn().mockReturnValue({
    publishedCTs: {
      fetch: jest.fn().mockResolvedValue({ data: { fields: [] } }),
    },
  }),
}));

Forma.Notification = { error: jest.fn() };

const onLoading = jest.fn();
const onUpdate = jest.fn();
const fetchEntities = jest.fn();
const getListQuery = ListQuery.getForEntries;

const listViewContext = {
  getView: jest.fn().mockReturnValue({}),
  setView: jest.fn(),
  assignView: jest.fn(),
};

let paginator;

const keys = {
  search: ['searchText', 'searchFilters', 'contentTypeId', 'id'],
  query: ['searchText', 'searchFilters', 'contentTypeId'],
};

const mockEntities = (count = 10) => {
  return [...new Array(count)].map((_, i) => ({
    sys: {
      id: `entry-${i}`,
    },
    isDeleted: () => false,
  }));
};

const createSearch = ({ entities, cache, view = {} } = {}) => {
  if (entities) {
    entities.total = entities.length;
    fetchEntities.mockResolvedValue(entities);
  }

  if (cache) {
    view.contentTypeId = 'ct-1';
  }

  listViewContext.getView.mockReturnValue(view);

  return createSearchController({
    onLoading,
    onUpdate,
    fetchEntities,
    keys,
    getListQuery,
    listViewContext,
    paginator,
    cache,
  });
};

describe('Controller', () => {
  beforeEach(() => {
    onLoading.mockClear();
    onUpdate.mockClear();
    fetchEntities.mockClear();
    listViewContext.getView.mockClear();
    listViewContext.setView.mockClear();
    listViewContext.assignView.mockClear();
    paginator = Paginator.create();
  });

  it('should be able to fetch entities and return empty', async () => {
    const { hasQuery, updateEntities } = createSearch({ entities: [] });

    expect(hasQuery()).toBe(false);
    const promise = updateEntities();
    expect(onLoading).toHaveBeenCalledWith(true);
    await promise;
    expect(onLoading).toHaveBeenCalledWith(false);
    expect(onUpdate).toHaveBeenCalledWith([]);
    expect(paginator.getTotal()).toBe(0);
  });

  it('should be able to fetch entities and return not deleted entries', async () => {
    const entities = mockEntities();
    entities[0].isDeleted = () => true;
    entities[9].isDeleted = () => true;

    const { hasQuery, updateEntities } = createSearch({ entities });

    expect(hasQuery()).toBe(false);
    const promise = updateEntities();
    expect(onLoading).toHaveBeenCalledWith(true);
    await promise;
    expect(onLoading).toHaveBeenCalledWith(false);
    expect(onUpdate).toHaveBeenCalledWith(entities.slice(1, -1));
    expect(paginator.getTotal()).toBe(10);
  });

  it('should be able to fetch entities according to sanitized view', async () => {
    const entities = mockEntities();
    const view = {
      order: { fieldId: 'createdAt', direction: 'ascending' },
      contentTypeId: 'ct-1',
      searchText: 'searchText',
      foobar: 'foobar',
    };

    const { hasQuery, updateEntities } = createSearch({ entities, view });

    expect(hasQuery()).toBe(true);
    await updateEntities();
    expect(fetchEntities).toHaveBeenNthCalledWith(1, {
      content_type: 'ct-1',
      limit: 40,
      order: 'sys.createdAt',
      skip: 0,
      query: 'searchText',
      'sys.archivedAt[exists]': 'false',
    });
  });

  it('should be able to fetch entities and update the cache', async () => {
    const entities = mockEntities();

    const cache = {
      entry: {
        setDisplayedFieldIds: jest.fn(),
        resolveLinkedEntities: jest.fn(),
      },
      asset: {
        setDisplayedFieldIds: jest.fn(),
        resolveLinkedEntities: jest.fn(),
      },
    };

    const { hasQuery, updateEntities } = createSearch({ entities, cache });

    expect(hasQuery()).toBe(true);
    const promise = updateEntities();
    expect(onLoading).toHaveBeenCalledWith(true);
    await promise;
    expect(onLoading).toHaveBeenCalledWith(false);
    expect(cache.entry.setDisplayedFieldIds).toHaveBeenCalledWith(undefined);
    expect(JSON.stringify(cache.entry.resolveLinkedEntities.mock.calls[0][0])).toEqual(
      JSON.stringify(entities)
    );
    expect(cache.asset.setDisplayedFieldIds).toHaveBeenCalledWith(undefined);
    expect(JSON.stringify(cache.asset.resolveLinkedEntities.mock.calls[0][0])).toEqual(
      JSON.stringify(entities)
    );
  });

  it('should be able to fetch entities in chunks', async () => {
    const entities = mockEntities();
    fetchEntities
      .mockRejectedValueOnce({
        status: 400,
        body: { message: 'Response size too big' },
      })
      .mockResolvedValue(entities);

    const { hasQuery, updateEntities } = createSearch({});

    expect(hasQuery()).toBe(false);
    const promise = updateEntities();
    expect(onLoading).toHaveBeenCalledWith(true);

    await promise;
    expect(fetchEntities).toHaveBeenNthCalledWith(1, {
      limit: 40,
      order: '-sys.updatedAt',
      skip: 0,
      'sys.archivedAt[exists]': 'false',
    });
    expect(onLoading).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(fetchEntities).toHaveBeenNthCalledWith(2, {
        limit: 20,
        order: '-sys.updatedAt',
        skip: 0,
        'sys.archivedAt[exists]': 'false',
      });
      expect(fetchEntities).toHaveBeenNthCalledWith(3, {
        limit: 20,
        order: '-sys.updatedAt',
        skip: 20,
        'sys.archivedAt[exists]': 'false',
      });
      expect(onUpdate).toHaveBeenCalledWith([...entities, ...entities]);
    });
  });

  describe('error handling', () => {
    it('should be able to fetch entities with invalid query and refetch', async () => {
      const error = { statusCode: 422 };
      const entities = mockEntities();
      fetchEntities.mockRejectedValueOnce(error).mockResolvedValue(entities);

      const { updateEntities } = createSearch({});

      await updateEntities();

      expect(listViewContext.setView).toHaveBeenCalledWith({});

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(entities);
      });
    });

    it('should be able to fetch entities with forbidden query and refetch', async () => {
      const error = { statusCode: 403 };
      const entities = mockEntities();
      fetchEntities.mockRejectedValueOnce(error).mockResolvedValue(entities);

      const { updateEntities } = createSearch({});

      await updateEntities();

      expect(listViewContext.setView).toHaveBeenCalledWith({});

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(entities);
      });
    });

    it('should be able to fetch entities with unknown content type and refetch', async () => {
      const error = {
        body: { details: { errors: [{ name: 'unknownContentType', value: 'DOESNOTEXIST' }] } },
      };
      const view = { contentTypeId: 'ct-1' };
      const entities = mockEntities();
      fetchEntities.mockRejectedValueOnce(error).mockResolvedValue(entities);

      const { updateEntities } = createSearch({ view });

      await updateEntities();

      expect(Forma.Notification.error).toHaveBeenCalledWith(
        'Provided Content Type "ct-1" does not exist. The content type filter has been reset to "Any"'
      );
      expect(listViewContext.assignView).toHaveBeenCalledWith({ contentTypeId: null });

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(entities);
      });
    });

    it('should be able to fetch entities with server error', async () => {
      const error = { statusCode: 500 };
      const entities = mockEntities();
      fetchEntities.mockRejectedValueOnce(error).mockResolvedValue(entities);

      const { updateEntities } = createSearch({});

      await updateEntities();

      expect(Forma.Notification.error).toHaveBeenCalledWith(
        'Your search didn’t go through this time. Try again.'
      );
    });

    it('should be able to fetch entities with unknown error', async () => {
      const error = { statusCode: 'unknown' };
      const entities = mockEntities();
      fetchEntities.mockRejectedValueOnce(error).mockResolvedValue(entities);

      const { updateEntities } = createSearch({});

      await updateEntities();

      expect(Forma.Notification.error).toHaveBeenCalledWith(
        'We detected an invalid search query. Please try again.'
      );
    });
  });
});
