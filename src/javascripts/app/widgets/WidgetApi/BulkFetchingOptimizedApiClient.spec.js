import { newEntityBatchLoaderFn } from 'app/widgets/WidgetApi/BulkFetchingOptimizedApiClient.es6';

const PENDING = new Promise(() => {});

describe('newEntityBatchLoaderFn({ getResources, newEntityNotFoundError}) -> entityBatchLoaderFn(entityIds)', () => {
  let getResources, newEntityNotFoundError, entityBatchLoaderFn;

  beforeEach(() => {
    getResources = jest.fn();
    newEntityNotFoundError = () => {
      throw new Error('Unexpected call during test');
    };
  });

  function setup() {
    entityBatchLoaderFn = newEntityBatchLoaderFn({
      getResources,
      newEntityNotFoundError
    });
  }

  describe('getResources() call', () => {
    beforeEach(() => {
      getResources.mockReturnValue(PENDING);
      setup();
    });

    it('is invoked with single ID', () => {
      entityBatchLoaderFn(['ID']);
      expectGetResourcesCall({ 'sys.id[in]': 'ID' });
    });

    it('is invoked with multiple IDs', () => {
      entityBatchLoaderFn(['ID_1', 'ID_2', 'ID_3']);
      expectGetResourcesCall({ 'sys.id[in]': 'ID_1,ID_2,ID_3' });
    });

    function expectGetResourcesCall(...args) {
      expect(getResources).toHaveBeenCalledTimes(1);
      expect(getResources).toHaveBeenCalledWith(...args);
    }
  });

  describe('requesting existing entities', () => {
    it('resolves with a single entity', async () => {
      const items = [newMockEntity('ID')];
      getResources.mockResolvedValue({ items });
      setup();
      const entities = await entityBatchLoaderFn(['ID']);
      expect(entities).toEqual(items);
    });

    it('resolves with multiple entities', async () => {
      const items = [newMockEntity('ID_1'), newMockEntity('ID_2')];
      getResources.mockResolvedValue({ items });
      setup();
      expect(await entityBatchLoaderFn(['ID_1', 'ID_2'])).toEqual(items);
      expect(await entityBatchLoaderFn(['ID_2', 'ID_1'])).toEqual([...items].reverse());
    });
  });

  describe('requesting missing entities', () => {
    const ERROR = new Error('UNKNOWN ENTITY TEST ERROR');

    beforeEach(() => {
      getResources.mockResolvedValue({ items: [] });
      newEntityNotFoundError = jest.fn(_id => ERROR);
      setup();
    });

    it('resolves with error for missing entity', async () => {
      const entities = await entityBatchLoaderFn(['UNKNOWN_ID']);
      expect(newEntityNotFoundError).toHaveBeenCalledTimes(1);
      expect(newEntityNotFoundError).toHaveBeenCalledWith('UNKNOWN_ID');
      expect(entities).toEqual([ERROR]);
    });

    it('resolves with error for missing entities', async () => {
      const ids = ['UNKNOWN_ID_1', 'UNKNOWN_ID_2', 'UNKNOWN_ID_3'];
      const entities = await entityBatchLoaderFn(ids);
      expect(newEntityNotFoundError).toHaveBeenCalledTimes(3);
      ids.forEach(id => {
        expect(newEntityNotFoundError).toHaveBeenCalledWith(id);
      });
      expect(entities).toEqual([ERROR, ERROR, ERROR]);
    });

    it('resolves with errors and existing entities', async () => {
      const items = [newMockEntity('ID_1'), newMockEntity('ID_2')];
      getResources.mockResolvedValue({ items });
      setup();
      const entities = await entityBatchLoaderFn(['ID_1', 'X_ID_1', 'X_ID_2', 'ID_2']);
      expect(entities).toEqual([items[0], ERROR, ERROR, items[1]]);
      expect(newEntityNotFoundError).toHaveBeenCalledTimes(2);
      expect(newEntityNotFoundError).toHaveBeenCalledWith('X_ID_1');
      expect(newEntityNotFoundError).toHaveBeenCalledWith('X_ID_2');
    });
  });

  describe('failing request', () => {
    const CLIENT_ERROR = {
      data: {
        sys: {
          type: 'Error'
        }
      }
    };

    beforeEach(() => {
      getResources.mockRejectedValue(CLIENT_ERROR);
      setup();
    });

    it('resolves with array of original error', async () => {
      const ids = ['ID_1', 'ID_2', 'ID_3'];
      const errors = await entityBatchLoaderFn(ids);
      expect(errors).toEqual([CLIENT_ERROR, CLIENT_ERROR, CLIENT_ERROR]);
    });
  });

  it('throws in case of faulty getResources() implementation', () => {
    const error = new Error();
    getResources = () => {
      throw error;
    };
    try {
      newEntityBatchLoaderFn({ getResources })([]);
    } catch (thrownError) {
      expect(thrownError).toBe(error);
    }
    expect.assertions(1);
  });

  function newMockEntity(id) {
    return { sys: { id } };
  }
});
