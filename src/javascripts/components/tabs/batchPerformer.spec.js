import _ from 'lodash';
import { createBatchPerformer } from './batchPerformer';
import * as analytics from 'analytics/Analytics';
import { getModule } from 'NgRegistry';

jest.mock('analytics/Analytics');
jest.mock('NgRegistry', () => ({ getModule: jest.fn() }));

analytics.track = jest.fn();

describe('Batch performer service', () => {
  const ENTITY_API = ['publish', 'unpublish', 'archive', 'unarchive', 'delete'];
  const API = ENTITY_API.concat(['duplicate']);
  let performer;
  let entities;
  let actionStubs;
  let entityType;

  describe('performing batch entry operations', () => {
    beforeEach(preparePerformer('Entry', makeEntry));

    it('creates API consisting of available entry batch operations', () => {
      API.forEach((method) => {
        expect(typeof performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();

    describe('duplicate', () => {
      beforeEach(() => {
        let i = 0;
        const retried = cc();
        const calls = [cc(), retried, cc(), retried];
        actionStubs = calls;
        getModule.mockReturnValue({
          space: { createEntry: ce },
          publishedCTs: {
            get: jest.fn().mockReturnValue({ data: { displayField: 123 } }),
          },
        });
        function cc() {
          return jest.fn().mockResolvedValue({});
        }
        function ce(...args) {
          return calls[i++].apply(null, args);
        }
      });

      testSharedBehavior('duplicate');
    });
  });

  describe('batch duplicate', () => {
    const displayField = 123;
    const mockSpace = (createEntry) => {
      getModule.mockReturnValue({
        publishedCTs: {
          get: jest.fn().mockReturnValue({ data: { displayField } }),
        },
        space: { createEntry },
      });
    };
    beforeEach(() => {
      mockSpace();
    });

    it('should add the index to the entry title of the duplicated entries', async () => {
      mockSpace(async (_id, { fields }) =>
        expect(fields[displayField]).toEqual({
          'en-US': 'Hello! (1)',
          de: 'Hallo! (1)',
        })
      );

      const makeEntityWrapper = () =>
        makeEntity({
          fields: {
            [displayField]: {
              'en-US': 'Hello!',
              de: 'Hallo!',
            },
          },
        });

      const makeEntry = () => ({
        ...makeEntityWrapper(),
        getSys: _.constant({
          type: 'Entry',
          contentType: { sys: { id: 'ctid' } },
        }),
      });

      const performer = preparePerformer('Entry', makeEntry).call(this);

      performer.duplicate();
    });

    it('should increment the index of the entry title of the duplicated entries', async () => {
      mockSpace(async (_id, { fields }) =>
        expect(fields[displayField]).toEqual({
          'en-US': 'Hello! (2)',
          de: null,
        })
      );

      const makeEntityWrapper = () =>
        makeEntity({
          fields: {
            [displayField]: {
              'en-US': 'Hello! (1)',
              de: null,
            },
          },
        });

      const makeEntry = () => ({
        ...makeEntityWrapper(),
        getSys: _.constant({
          type: 'Entry',
          contentType: { sys: { id: 'ctid' } },
        }),
      });

      const performer = preparePerformer('Entry', makeEntry).call(this);

      performer.duplicate();
    });

    it('should not break down if the entry title is not defined', async () => {
      mockSpace(async (_id, { fields }) => expect(fields[displayField]).toBeNull());

      const makeEntityWrapper = () =>
        makeEntity({
          fields: {
            [displayField]: null,
          },
        });

      const makeEntry = () => ({
        ...makeEntityWrapper(),
        getSys: _.constant({
          type: 'Entry',
          contentType: { sys: { id: 'ctid' } },
        }),
      });

      const performer = preparePerformer('Entry', makeEntry).call(this);

      performer.duplicate();
    });

    it('should increment the index of the entry title of the batch duplicated entries', async () => {
      mockSpace(async (_id, { fields }) =>
        expect(fields[displayField]).toEqual({
          'en-US': 'Hello! (0) (1)',
          de: 'Hallo! (0) (1)',
        })
      );

      const makeEntityWrapper = () =>
        makeEntity({
          fields: {
            [displayField]: {
              'en-US': 'Hello! (0)',
              de: 'Hallo! (0)',
            },
          },
        });

      const makeEntry = () => ({
        ...makeEntityWrapper(),
        getSys: _.constant({
          type: 'Entry',
          contentType: { sys: { id: 'ctid' } },
        }),
      });

      const performer = preparePerformer('Entry', makeEntry).call(this);

      performer.duplicate();
    });

    it('should increment the multi-digit index of the entry title of the duplicated entries', async () => {
      mockSpace(async (_id, { fields }) =>
        expect(fields[displayField]).toEqual({
          'en-US': 'Hello! (11)',
          de: 'Hallo! (11)',
        })
      );

      const makeEntityWrapper = () =>
        makeEntity({
          fields: {
            [displayField]: {
              'en-US': 'Hello! (10)',
              de: 'Hallo! (10)',
            },
          },
        });

      const makeEntry = () => ({
        ...makeEntityWrapper(),
        getSys: _.constant({
          type: 'Entry',
          contentType: { sys: { id: 'ctid' } },
        }),
      });

      const performer = preparePerformer('Entry', makeEntry).call(this);

      performer.duplicate();
    });
  });

  describe('performing batch asset operations', () => {
    beforeEach(preparePerformer('Asset', makeEntity));

    it('creates API consisting of available asset batch operations', () => {
      ENTITY_API.forEach((method) => {
        expect(typeof performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();
  });

  function preparePerformer(type, makeFn) {
    entityType = type;
    return () => {
      entities = [makeFn(), makeFn(), makeFn()];
      performer = createBatchPerformer({ entityType, entities });
      return performer;
    };
  }

  function makeEntry() {
    const sys = { type: 'Entry', contentType: { sys: { id: 'ctid' } } };
    return _.extend(makeEntity(), { getSys: _.constant(sys) });
  }

  function makeEntity(data) {
    const entity = { data };
    entity.getVersion = jest.fn().mockReturnValue(123);
    entity.setDeleted = jest.fn();
    return _.transform(
      ENTITY_API,
      (entity, method) => {
        entity[method] = jest.fn().mockResolvedValue(entity);
      },
      entity
    );
  }

  function describeSharedBehavior() {
    describeBatchBehavior('publish');
    describeBatchBehavior('unpublish');
    describeBatchBehavior('archive');
    describeBatchBehavior('unarchive');
    describeBatchBehavior('delete');
  }

  function describeBatchBehavior(action, extraTests) {
    describe(action, () => {
      beforeEach(() => {
        actionStubs = _.map(entities, (entity) => entity[action]);
      });

      testSharedBehavior(action);
      if (_.isFunction(extraTests)) {
        extraTests();
      }
    });
  }

  function testSharedBehavior(action) {
    itCallsAction(action);
    itResolvesWithResult(action);
    itTracksAnalytics(action);
    itHandles404(action);
  }

  function itCallsAction(action) {
    it('calls entity action for all selected entities', () => {
      performer[action]();
      actionStubs.forEach((actionStub) => {
        expect(actionStub).toHaveBeenCalledTimes(1);
      });
    });
  }

  function itResolvesWithResult(action) {
    it('resolves with an object containing successful and failed call arrays', () => {
      actionStubs[1].mockRejectedValue('boom');
      return performer[action]().then((results) => {
        expect(results.succeeded).toHaveLength(2);
        expect(results.failed).toHaveLength(1);
      });
    });
  }

  function itTracksAnalytics(action) {
    it('creates analytics event', () => {
      return performer[action]().then(() => {
        expect(analytics.track).toHaveBeenCalledTimes(1);
        expect(analytics.track).toHaveBeenCalledWith('search:bulk_action_performed', {
          action,
          entityType,
        });
      });
    });
  }

  function itHandles404(action) {
    it('set as deleted and fires delete listener for 404 HTTP errors', async () => {
      actionStubs[1].mockRejectedValue({ statusCode: 404 });
      const entity = entities[1];
      await performer[action]();
      expect(entity.setDeleted).toHaveBeenCalledTimes(1);
    });
  }
});
