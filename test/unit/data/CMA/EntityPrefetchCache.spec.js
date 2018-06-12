describe('data/CMA/EntityPrefetchCache', () => {
  beforeEach(function () {
    module('contentful/test');
    const $q = this.$inject('$q');
    const createCache = this.$inject('data/CMA/EntityPrefetchCache').default;

    this.queryEntities = sinon.spy((query) => {
      const ids = query['sys.id[in]'].split(',');
      return $q.resolve(ids.map((id) => {
        return {
          data: { sys: {id: id} }
        };
      }));
    });

    this.cache = createCache(this.queryEntities);
  });

  it('prefetches entities', function* () {
    this.cache.set(['A', 'B']);
    sinon.assert.calledOnce(this.queryEntities);

    const a = yield this.cache.get('A');
    expect(a.data.sys.id).toBe('A');
    const b = yield this.cache.get('B');
    expect(b.data.sys.id).toBe('B');

    sinon.assert.calledOnce(this.queryEntities);
  });

  it('only loads ids not already in cache', function* () {
    this.cache.set(['A', 'B']);
    this.queryEntities.reset();
    this.cache.set(['B', 'X', 'Y']);
    sinon.assert.calledWith(this.queryEntities, sinon.match.has('sys.id[in]', 'X,Y'));

    const x = yield this.cache.get('X');
    expect(x.data.sys.id).toBe('X');
    const y = yield this.cache.get('Y');
    expect(y.data.sys.id).toBe('Y');

    sinon.assert.calledOnce(this.queryEntities);
  });

  it('removes ids not required anymore', function* () {
    this.cache.set(['A', 'B']);
    this.cache.set(['B']);

    this.queryEntities.reset();
    const a = yield this.cache.get('A');
    expect(a.data.sys.id).toBe('A');
    sinon.assert.calledOnce(this.queryEntities);
  });

  it('chunks up IDs', function () {
    const ids = _.range(101).map((i) => `id${i}`);
    this.cache.set(ids);
    sinon.assert.callCount(this.queryEntities, 3);
  });
});
