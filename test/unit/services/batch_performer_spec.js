'use strict';

describe('Batch performer service', function () {
  const ENTITY_API = ['publish', 'unpublish', 'archive', 'unarchive', 'delete'];
  const API = ENTITY_API.concat(['duplicate']);

  beforeEach(function () {
    module('contentful/test');
    this.create = this.$inject('batchPerformer').create;
    this.notification = this.mockService('notification');
    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.spy();
  });

  describe('performing batch entry operations', function () {
    beforeEach(preparePerformer('Entry', makeEntry));

    it('creates API consisting of available entry batch operations', function () {
      API.forEach(function (method) {
        expect(typeof this.performer[method]).toBe('function');
      }.bind(this));
    });

    describeSharedBehavior();

    describe('duplicate', function () {
      beforeEach(function () {
        let i = 0;
        const retried = cc();
        const calls = [cc(), retried, cc(), retried];
        this.actionStubs = calls;
        this.$inject('spaceContext').space = {createEntry: ce};

        function cc () { return sinon.stub().resolves({}); }
        function ce () { return calls[i++].apply(null, arguments); }
      });

      testSharedBehavior('duplicate');
    });
  });

  describe('performing batch asset operations', function () {
    beforeEach(preparePerformer('Asset', makeEntity));

    it('creates API consisting of available asset batch operations', function () {
      ENTITY_API.forEach(function (method) {
        expect(typeof this.performer[method]).toBe('function');
      }.bind(this));
    });

    describeSharedBehavior();
  });

  function preparePerformer (entityType, makeFn) {
    return function () {
      this.entities = [makeFn(), makeFn(), makeFn()];
      this.performer = this.create({
        entityType: this.entityType = entityType,
        getSelected: _.constant(this.entities),
        onComplete: this.onComplete = sinon.spy(),
        onDelete: this.onDelete = sinon.spy()
      });
    };
  }

  function makeEntry () {
    const sys = {type: 'Entry', contentType: {sys: {id: 'ctid'}}};
    return _.extend(makeEntity(), {getSys: _.constant(sys)});
  }

  function makeEntity () {
    const entity = {};
    entity.getVersion = sinon.stub().returns(123);
    entity.setDeleted = sinon.spy();
    return _.transform(ENTITY_API, function (entity, method) {
      entity[method] = sinon.stub().resolves(entity);
    }, entity);
  }

  function describeSharedBehavior () {
    describeBatchBehavior('publish');
    describeBatchBehavior('unpublish');
    describeBatchBehavior('archive');
    describeBatchBehavior('unarchive');
    describeBatchBehavior('delete', function () { itCallsDeleteListener(); });
  }

  function describeBatchBehavior (action, extraTests) {
    describe(action, function () {
      beforeEach(function () {
        this.actionStubs = _.map(this.entities, function (entity) {
          return entity[action];
        });
      });

      testSharedBehavior(action);
      if (_.isFunction(extraTests)) { extraTests(); }
    });
  }

  function testSharedBehavior (action) {
    itCallsAction(action);
    itResolvesWithResult(action);
    itCallsCompleteListener(action);
    itNotifiesAboutResult(action);
    itTracksAnalytics(action);
    itHandles404(action);
  }

  function itCallsAction (action) {
    it('calls entity action for all selected entities', function () {
      this.performer[action]();
      this.actionStubs.forEach(function (actionStub) {
        sinon.assert.calledOnce(actionStub);
      });
    });
  }

  function itCallsCompleteListener (action) {
    pit('calls complete listener', function () {
      return this.performer[action]().then(function () {
        sinon.assert.calledOnce(this.onComplete);
      }.bind(this));
    });
  }

  function itResolvesWithResult (action) {
    pit('resolves with an object containing successful and failed call arrays', function () {
      this.actionStubs[1].rejects('boom');
      return this.performer[action]().then(function (results) {
        expect(results.succeeded.length).toBe(2);
        expect(results.failed.length).toBe(1);
      });
    });
  }

  function itNotifiesAboutResult (action) {
    pit('notifies about results of the operation', function () {
      const isEntry = this.entityType === 'Entry';
      this.actionStubs[1].rejects('boom!');

      return this.performer[action]().then(function () {
        sinon.assert.calledOnce(this.notification.info);
        expect(this.notification.info.args[0][0]).toMatch(isEntry ? /^2 Entries/ : /^2 Assets/);
        sinon.assert.calledOnce(this.notification.warn);
        expect(this.notification.warn.args[0][0]).toMatch(isEntry ? /^1 Entries/ : /^1 Assets/);
      }.bind(this));
    });
  }

  function itTracksAnalytics (action) {
    pit('creates analytics event', function () {
      return this.performer[action]().then(() => {
        sinon.assert.calledOnce(this.analytics.track.withArgs('search:bulk_action_performed'));
      });
    });
  }

  function itHandles404 (action) {
    it('set as deleted and fires delete listener for 404 HTTP errors', function () {
      const actionStub = this.actionStubs[1];
      const entity = this.entities[1];
      actionStub.rejects({statusCode: 404});
      this.performer[action]();
      this.$apply();
      sinon.assert.calledOnce(entity.setDeleted);
      sinon.assert.calledOnce(this.onDelete.withArgs(entity));
    });
  }

  function itCallsDeleteListener () {
    pit('fires delete listener for successful calls', function () {
      return this.performer.delete().then(function () {
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[0]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[1]));
        sinon.assert.calledOnce(this.onDelete.withArgs(this.entities[2]));
      }.bind(this));
    });
  }
});
