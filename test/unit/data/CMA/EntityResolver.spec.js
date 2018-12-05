'use strict';
import _ from 'lodash';

describe('data/CMA/EntityResolver.es6', () => {
  beforeEach(function() {
    module('contentful/test');
    const $q = this.$inject('$q');
    this.getEntries = sinon.spy(query => {
      const ids = query['sys.id[in]'].split(',');
      const existingIds = ids.filter(id => !id.match(/missing/));
      const entities = existingIds.map(id => {
        return {
          sys: { id: id },
          data: id
        };
      });
      return $q.resolve({ items: entities });
    });
    const space = { getEntries: this.getEntries };
    this.store = this.$inject('data/CMA/EntityResolver.es6').forType('Entry', space);
  });

  it('fetches each ID', function*() {
    const results = yield this.store.load(['a', 'missing', 'b', 'c']);
    const ids = results.map(([id, _]) => id);
    expect(ids).toEqual(['a', 'missing', 'b', 'c']);
    const entityData = results.map(([_, entity]) => entity && entity.data);
    expect(entityData).toEqual(['a', undefined, 'b', 'c']);
  });

  it('only queries ids that are not loaded yet', function*() {
    yield this.store.load(['c']);
    this.getEntries.reset();
    const results = yield this.store.load(['a', 'b', 'c']);
    const ids = results.map(([id, _]) => id);
    expect(ids).toEqual(['a', 'b', 'c']);
    sinon.assert.calledWith(this.getEntries, sinon.match.has('sys.id[in]', 'a,b'));
  });

  it('does not query API when all entities are loaded', function*() {
    const es1 = yield this.store.load(['a', 'b', 'c']);
    sinon.assert.calledOnce(this.getEntries);
    const es2 = yield this.store.load(['a', 'b', 'c']);
    expect(es1).toEqual(es2);
    sinon.assert.calledOnce(this.getEntries);
  });

  it('splits queries for more than 50 ids', function*() {
    const ids = _.range(51);
    const results = yield this.store.load(ids);
    expect(results.map(([id, _]) => id)).toEqual(ids);
    sinon.assert.calledTwice(this.getEntries);
  });

  it('passes limit of 50 to query', function*() {
    yield this.store.load(['a', 'b', 'c']);
    sinon.assert.calledWith(this.getEntries, sinon.match.has('limit', 50));
  });

  it('does not fetch manually added entities', function*() {
    this.store.addEntity({
      sys: { id: 'manual-1' },
      data: 'manual'
    });
    const results = yield this.store.load(['manual-1', 'a']);
    expect(results[0][1].data).toEqual('manual');
    sinon.assert.calledWith(this.getEntries, sinon.match.has('sys.id[in]', 'a'));
  });

  it('returns empty list if response is 404', function*() {
    const space = { getEntries: sinon.stub().rejects({ status: 404 }) };
    const store = this.$inject('data/CMA/EntityResolver.es6').forType('Entry', space);
    const results = yield store.load(['manual-1', 'a']);
    const entities = results.map(([_id, data]) => data);
    expect(entities).toEqual([undefined, undefined]);
  });
});
