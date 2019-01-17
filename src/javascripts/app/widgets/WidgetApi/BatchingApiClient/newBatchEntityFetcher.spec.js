import nextTick from '../../../../../../test/helpers/flushPromises';
import newBatchEntityFetcher from './newBatchEntityFetcher.es6';

jest.mock('Config.es6', () => ({ apiUrl: v => `https://api.some-domain.com/${v}` }));
jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' })
}));

const PENDING = new Promise(() => {});

const LONGEST_VALID_ID = 'o'.repeat(64);
const INVALID_LONG_ID = LONGEST_VALID_ID + 'X';

describe('newBatchEntityFetcher({ getResources, resourceContext }) -> fetchEntity(id)', () => {
  let getResources, resourceContext, fetch;

  beforeEach(() => {
    getResources = jest.fn().mockReturnValue(PENDING);
    resourceContext = {
      type: 'Someentity',
      envId: 'ENVIRONMENT_ID',
      spaceId: 'SPACE_ID'
    };
  });

  function setup() {
    fetch = newBatchEntityFetcher({
      getResources,
      resourceContext
    });
  }

  describe('invoking getResources()', () => {
    beforeEach(() => {
      let i = 0;
      getResources.mockImplementation(query => {
        const ids = query['sys.id[in]'].split(',');
        const mockEntities = ids.map(id => ({ sys: { id }, i: i++ }));
        return Promise.resolve({ items: mockEntities });
      });
      setup();
    });

    it('happens in the next tick', async () => {
      fetch('ID');
      expect(getResources).not.toHaveBeenCalled();
      await nextTick();
      expect(getResources).toHaveBeenCalledTimes(1);
    });

    it('is cached within the same tick', async () => {
      const promise1 = fetch('ID');
      const promise2 = fetch('ID');
      const entity1 = await promise1;
      const entity2 = await promise2;
      expect(getResources).toHaveBeenCalledTimes(1);
      expect(entity1).toEqual(entity2);
    });

    it('is not cached between ticks', async () => {
      const entity1 = await fetch('ID');
      const entity2 = await fetch('ID');
      expect(getResources).toHaveBeenCalledTimes(2);
      expect(entity1).not.toEqual(entity2);
    });
  });

  describe('loading an unknown ID', () => {
    let error;

    beforeEach(async () => {
      getResources.mockResolvedValue({ items: [] });
      setup();
      try {
        await fetch('SOME_UNKNOWN_ID');
      } catch (e) {
        error = e;
      }
    });

    it('throws an Error', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('is constructed correctly', () => {
      expect(error).toEqual(
        expect.objectContaining({
          status: 404,
          statusCode: 404,
          code: 'NotFound',
          headers: expect.any(Function),
          request: expect.any(Object),
          data: expect.any(Object)
        })
      );
    });

    it('contains CMA error in it`s .data property', () => {
      expect(error.data).toEqual(
        expect.objectContaining({
          sys: {
            type: 'Error',
            id: 'NotFound'
          },
          message: expect.any(String),
          details: {
            type: 'Someentity',
            id: 'SOME_UNKNOWN_ID',
            environment: 'ENVIRONMENT_ID',
            space: 'SPACE_ID'
          },
          requestId: 'web-app__batchEntityFetcher'
        })
      );
    });
  });

  describe('loading an invalid ID', () => {
    let error;

    beforeEach(async () => {
      getResources.mockResolvedValue({ items: [] });
      setup();
      try {
        await fetch(INVALID_LONG_ID);
      } catch (e) {
        error = e;
      }
    });

    it('throws an Error', function() {
      expect(error).toBeInstanceOf(Error);
    });

    it('is treated as 404 rather than 400', function() {
      expect(error.status).toEqual(404);
    });
  });
});
