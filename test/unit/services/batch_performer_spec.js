import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('Batch performer service', () => {
  const ENTITY_API = ['publish', 'unpublish', 'archive', 'unarchive', 'delete'];
  const API = ENTITY_API.concat(['duplicate']);

  let createBatchPerformer;

  beforeEach(async function () {
    this.analytics = {
      track: sinon.stub(),
    };

    this.system.set('analytics/Analytics', this.analytics);

    await $initialize(this.system);

    createBatchPerformer = $inject('batchPerformer').create;
  });

  describe('performing batch entry operations', () => {
    beforeEach(preparePerformer('Entry', makeEntry));

    it('creates API consisting of available entry batch operations', function () {
      API.forEach((method) => {
        expect(typeof this.performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();

    describe('duplicate', () => {
      beforeEach(function () {
        let i = 0;
        const retried = cc();
        const calls = [cc(), retried, cc(), retried];
        this.actionStubs = calls;
        const spaceContext = $inject('spaceContext');
        spaceContext.space = { createEntry: ce };
        spaceContext.publishedCTs.get = sinon.stub().returns({ data: { displayField: 123 } });

        function cc() {
          return sinon.stub().resolves({});
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
    let spaceContext;

    beforeEach(() => {
      spaceContext = $inject('spaceContext');
      spaceContext.publishedCTs.get = sinon.stub().returns({ data: { displayField } });
    });

    it('should add the index to the entry title of the duplicated entries', async function () {
      spaceContext.space = {
        createEntry: (_id, { fields }) =>
          new Promise((resolve, reject) => {
            try {
              expect(fields[displayField]).toEqual({
                'en-US': 'Hello! (1)',
                de: 'Hallo! (1)',
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      };

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

    it('should increment the index of the entry title of the duplicated entries', async function () {
      spaceContext.space = {
        createEntry: (_id, { fields }) =>
          new Promise((resolve, reject) => {
            try {
              expect(fields[displayField]).toEqual({
                'en-US': 'Hello! (2)',
                de: null,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      };

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

    it('should not break down if the entry title is not defined', async function () {
      spaceContext.space = {
        createEntry: (_id, { fields }) =>
          new Promise((resolve, reject) => {
            try {
              expect(fields[displayField]).toEqual(null);
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      };

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

    it('should increment the index of the entry title of the duplicated entries', async function () {
      spaceContext.space = {
        createEntry: (_id, { fields }) =>
          new Promise((resolve, reject) => {
            try {
              expect(fields[displayField]).toEqual({
                'en-US': 'Hello! (0) (1)',
                de: 'Hallo! (0) (1)',
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      };

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

    it('should increment the multi-digit index of the entry title of the duplicated entries', async function () {
      spaceContext.space = {
        createEntry: (_id, { fields }) =>
          new Promise((resolve, reject) => {
            try {
              expect(fields[displayField]).toEqual({
                'en-US': 'Hello! (11)',
                de: 'Hallo! (11)',
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
      };

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

    it('creates API consisting of available asset batch operations', function () {
      ENTITY_API.forEach((method) => {
        expect(typeof this.performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();
  });

  function preparePerformer(entityType, makeFn) {
    return function () {
      this.entities = [makeFn(), makeFn(), makeFn()];
      this.performer = createBatchPerformer({
        entityType: (this.entityType = entityType),
        getSelected: () => this.entities,
        onComplete: (this.onComplete = sinon.spy()),
        onDelete: (this.onDelete = sinon.spy()),
      });
      return this.performer;
    };
  }

  function makeEntry() {
    const sys = { type: 'Entry', contentType: { sys: { id: 'ctid' } } };
    return _.extend(makeEntity(), { getSys: _.constant(sys) });
  }

  function makeEntity(data) {
    const entity = { data };
    entity.getVersion = sinon.stub().returns(123);
    entity.setDeleted = sinon.spy();
    return _.transform(
      ENTITY_API,
      (entity, method) => {
        entity[method] = sinon.stub().resolves(entity);
      },
      entity
    );
  }

  function describeSharedBehavior() {
    describeBatchBehavior('publish');
    describeBatchBehavior('unpublish');
    describeBatchBehavior('archive');
    describeBatchBehavior('unarchive');
    describeBatchBehavior('delete', () => {
      itCallsDeleteListener();
    });
  }

  function describeBatchBehavior(action, extraTests) {
    describe(action, () => {
      beforeEach(function () {
        this.actionStubs = _.map(this.entities, (entity) => entity[action]);
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
    itCallsCompleteListener(action);
    itTracksAnalytics(action);
    itHandles404(action);
  }

  function itCallsAction(action) {
    it('calls entity action for all selected entities', function () {
      this.performer[action]();
      this.actionStubs.forEach((actionStub) => {
        sinon.assert.calledOnce(actionStub);
      });
    });
  }

  function itCallsCompleteListener(action) {
    it('calls complete listener', function () {
      return this.performer[action]().then(() => {
        sinon.assert.calledOnce(this.onComplete);
      });
    });
  }

  function itResolvesWithResult(action) {
    it('resolves with an object containing successful and failed call arrays', function () {
      this.actionStubs[1].rejects('boom');
      return this.performer[action]().then((results) => {
        expect(results.succeeded.length).toBe(2);
        expect(results.failed.length).toBe(1);
      });
    });
  }

  function itTracksAnalytics(action) {
    it('creates analytics event', function () {
      return this.performer[action]().then(() => {
        sinon.assert.calledOnce(this.analytics.track.withArgs('search:bulk_action_performed'));
      });
    });
  }

  function itHandles404(action) {
    it('set as deleted and fires delete listener for 404 HTTP errors', function () {
      const actionStub = this.actionStubs[1];
      const entity = this.entities[1];
      actionStub.rejects({ statusCode: 404 });
      this.performer[action]();
      $apply();
      sinon.assert.calledOnce(entity.setDeleted);
      sinon.assert.calledOnce(this.onDelete.withArgs(entity));
    });
  }

  function itCallsDeleteListener() {
    it('fires delete listener for successful calls', function () {
      return this.performer.delete().then(() => {
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[0]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[1]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[2]));
      });
    });
  }
});
