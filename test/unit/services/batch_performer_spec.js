'use strict';

import _ from 'lodash';

describe('Batch performer service', () => {
  const ENTITY_API = ['publish', 'unpublish', 'archive', 'unarchive', 'delete'];
  const API = ENTITY_API.concat(['duplicate']);

  beforeEach(function() {
    module('contentful/test');
    this.create = this.$inject('batchPerformer').create;
    this.analytics = this.$inject('analytics/Analytics.es6');
    this.analytics.track = sinon.spy();
  });

  describe('performing batch entry operations', () => {
    beforeEach(preparePerformer('Entry', makeEntry));

    it('creates API consisting of available entry batch operations', function() {
      API.forEach(method => {
        expect(typeof this.performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();

    describe('duplicate', () => {
      beforeEach(function() {
        let i = 0;
        const retried = cc();
        const calls = [cc(), retried, cc(), retried];
        this.actionStubs = calls;
        this.$inject('spaceContext').space = { createEntry: ce };

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

  describe('performing batch asset operations', () => {
    beforeEach(preparePerformer('Asset', makeEntity));

    it('creates API consisting of available asset batch operations', function() {
      ENTITY_API.forEach(method => {
        expect(typeof this.performer[method]).toBe('function');
      });
    });

    describeSharedBehavior();
  });

  function preparePerformer(entityType, makeFn) {
    return function() {
      this.entities = [makeFn(), makeFn(), makeFn()];
      this.performer = this.create({
        entityType: (this.entityType = entityType),
        getSelected: _.constant(this.entities),
        onComplete: (this.onComplete = sinon.spy()),
        onDelete: (this.onDelete = sinon.spy())
      });
    };
  }

  function makeEntry() {
    const sys = { type: 'Entry', contentType: { sys: { id: 'ctid' } } };
    return _.extend(makeEntity(), { getSys: _.constant(sys) });
  }

  function makeEntity() {
    const entity = {};
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
      beforeEach(function() {
        this.actionStubs = _.map(this.entities, entity => entity[action]);
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
    it('calls entity action for all selected entities', function() {
      this.performer[action]();
      this.actionStubs.forEach(actionStub => {
        sinon.assert.calledOnce(actionStub);
      });
    });
  }

  function itCallsCompleteListener(action) {
    it('calls complete listener', function() {
      return this.performer[action]().then(() => {
        sinon.assert.calledOnce(this.onComplete);
      });
    });
  }

  function itResolvesWithResult(action) {
    it('resolves with an object containing successful and failed call arrays', function() {
      this.actionStubs[1].rejects('boom');
      return this.performer[action]().then(results => {
        expect(results.succeeded.length).toBe(2);
        expect(results.failed.length).toBe(1);
      });
    });
  }

  function itTracksAnalytics(action) {
    it('creates analytics event', function() {
      return this.performer[action]().then(() => {
        sinon.assert.calledOnce(this.analytics.track.withArgs('search:bulk_action_performed'));
      });
    });
  }

  function itHandles404(action) {
    it('set as deleted and fires delete listener for 404 HTTP errors', function() {
      const actionStub = this.actionStubs[1];
      const entity = this.entities[1];
      actionStub.rejects({ statusCode: 404 });
      this.performer[action]();
      this.$apply();
      sinon.assert.calledOnce(entity.setDeleted);
      sinon.assert.calledOnce(this.onDelete.withArgs(entity));
    });
  }

  function itCallsDeleteListener() {
    it('fires delete listener for successful calls', function() {
      return this.performer.delete().then(() => {
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[0]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[1]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[2]));
      });
    });
  }
});
