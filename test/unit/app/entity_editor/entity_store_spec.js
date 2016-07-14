'use strict';

describe('EntityStore', function () {
  beforeEach(function () {
    module('contentful/test');
    this.space = {fetch: sinon.stub()};
    this.store = this.$inject('EntityStore').create(this.space, 'fetch');
  });

  const makeLink = makeEntity;
  function makeEntity (id) {
    return {sys: {id: id}};
  }

  describe('#add', function () {
    const id = 'entityid';
    const entity = makeEntity(id);

    it('adds an entity to the store', function () {
      this.store.add(entity);
      expect(this.store.get(id)).toBe(entity);
    });

    it('replaces already added entity', function () {
      const entity2 = _.extend({newVersion: true}, entity);
      this.store.add(entity);
      expect(this.store.get(id).newVersion).toBeUndefined();
      this.store.add(entity2);
      expect(this.store.get(id).newVersion).toBe(true);
    });
  });

  describe('#get', function () {
    it('returns undefined for an unknown entity', function () {
      expect(this.store.get('blahblah')).toBeUndefined();
    });

    it('can be called with both ID or a link', function () {
      const id = 'entityid';
      const entity = makeEntity(id);

      this.store.add(entity);
      expect(this.store.get(id)).toBe(entity);
      expect(this.store.get(makeLink(id))).toBe(entity);
    });
  });

  describe('#prefetch', function () {
    const links = [makeLink('e1'), makeLink('e2')];

    pit('skips when no links are given', function () {
      return this.store.prefetch().then(function (store) {
        sinon.assert.notCalled(this.space.fetch);
        expect(store).toBe(this.store);
      }.bind(this));
    });

    pit('skips if all requested IDs are already in the store', function () {
      this.store.add(makeEntity('e1'));
      this.store.add(makeEntity('e2'));

      return this.store.prefetch(links).then(function (store) {
        sinon.assert.notCalled(this.space.fetch);
        expect(store).toBe(this.store);
      }.bind(this));
    });

    pit('fetches entities using [in] query', function () {
      const entities = [makeEntity('e1'), makeEntity('e2')];
      this.space.fetch.resolves({items: entities});

      return this.store.prefetch(links).then(function (store) {
        const q = {'sys.id[in]': 'e1,e2'};
        sinon.assert.calledOnce(this.space.fetch.withArgs(q));
        expect(store).toBe(this.store);
        expect(store.get('e1')).toBe(entities[0]);
        expect(store.get('e2')).toBe(entities[1]);
      }.bind(this));
    });
  });
});
