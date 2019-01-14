import newEntityBatchLoaderFn from './newEntityBatchLoaderFn.es6';
import * as logger from 'ng/logger';

jest.mock('ng/logger', () => ({
  logServerError: jest.fn()
}));

const PENDING = new Promise(() => {});

const LONGEST_VALID_ID = 'o'.repeat(64);
const INVALID_LONG_ID = LONGEST_VALID_ID + 'X';

describe('newEntityBatchLoaderFn({ getResources, newEntityNotFoundError}) -> entityBatchLoaderFn(entityIds)', () => {
  let getResources, newEntityNotFoundError, entityBatchLoaderFn;

  beforeEach(() => {
    jest.clearAllMocks();
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

    it('is only invoked with IDs <= 64 characters to avoid 504 CMA response', () => {
      entityBatchLoaderFn([LONGEST_VALID_ID, INVALID_LONG_ID, INVALID_LONG_ID.repeat(100)]);
      expectGetResourcesCall({ 'sys.id[in]': LONGEST_VALID_ID });
    });

    it('is not invoked if there are no valid IDs', () => {
      entityBatchLoaderFn([INVALID_LONG_ID]);
      expect(getResources).toHaveBeenCalledTimes(0);
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

    it('resolves with error for missing entity (ID too long)', async () => {
      const entities = await entityBatchLoaderFn([INVALID_LONG_ID]);
      expect(newEntityNotFoundError).toHaveBeenCalledTimes(1);
      expect(newEntityNotFoundError).toHaveBeenCalledWith(INVALID_LONG_ID);
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
      const entities = await entityBatchLoaderFn(['ID_1', 'UNKNOWN_ID', INVALID_LONG_ID, 'ID_2']);
      expect(entities).toEqual([items[0], ERROR, ERROR, items[1]]);
      expect(newEntityNotFoundError).toHaveBeenCalledTimes(2);
      expect(newEntityNotFoundError).toHaveBeenCalledWith('UNKNOWN_ID');
      expect(newEntityNotFoundError).toHaveBeenCalledWith(INVALID_LONG_ID);
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

    it('logs server error to `logger.logServerError()`', async () => {
      const validIds = ['ID', 'ANOTHER_ID'];
      await entityBatchLoaderFn([...validIds, INVALID_LONG_ID]);
      expect(logger.logServerError).toHaveBeenCalledTimes(1);
      expect(logger.logServerError).toHaveBeenCalledWith(expect.any(String), {
        error: CLIENT_ERROR,
        data: {
          requestedIds: validIds, // INVALID_LONG_ID not expected to be in here.
          requestedIdsCount: 2,
          requestedIdsCharacterCount: 12
        }
      });
    });
  });

  it('throws in case of faulty getResources() implementation', () => {
    const error = new Error();
    getResources = () => {
      throw error;
    };
    try {
      newEntityBatchLoaderFn({ getResources })(['SOME_ID']);
    } catch (thrownError) {
      expect(thrownError).toBe(error);
    }
    expect.assertions(1);
  });

  function newMockEntity(id) {
    return { sys: { id } };
  }
});
