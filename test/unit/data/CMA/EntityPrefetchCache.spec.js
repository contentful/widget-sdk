import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('data/CMA/EntityPrefetchCache', () => {
  beforeEach(async function () {
    const { default: createCache } = await this.system.import('data/CMA/EntityPrefetchCache');

    await $initialize(this.system);

    const $q = $inject('$q');

    this.queryEntities = sinon.spy((query) => {
      const ids = query['sys.id[in]'].split(',');
      return $q.resolve(
        ids.map((id) => {
          return {
            data: { sys: { id: id } },
          };
        })
      );
    });

    this.cache = createCache(this.queryEntities);
  });

  it('prefetches entities', async function () {
    this.cache.set(['A', 'B']);
    sinon.assert.calledOnce(this.queryEntities);

    const a = await this.cache.get('A');
    expect(a.data.sys.id).toBe('A');
    const b = await this.cache.get('B');
    expect(b.data.sys.id).toBe('B');

    sinon.assert.calledOnce(this.queryEntities);
  });

  it('only loads ids not already in cache', async function () {
    this.cache.set(['A', 'B']);
    this.queryEntities.reset();
    this.cache.set(['B', 'X', 'Y']);
    sinon.assert.calledWith(this.queryEntities, sinon.match.has('sys.id[in]', 'X,Y'));

    const x = await this.cache.get('X');
    expect(x.data.sys.id).toBe('X');
    const y = await this.cache.get('Y');
    expect(y.data.sys.id).toBe('Y');

    sinon.assert.calledOnce(this.queryEntities);
  });

  it('removes ids not required anymore', async function () {
    this.cache.set(['A', 'B']);
    this.cache.set(['B']);

    this.queryEntities.reset();
    const a = await this.cache.get('A');
    expect(a.data.sys.id).toBe('A');
    sinon.assert.calledOnce(this.queryEntities);
  });

  it('chunks up IDs', function () {
    const ids = _.range(101).map((i) => `id${i}`);
    this.cache.set(ids);
    sinon.assert.callCount(this.queryEntities, 3);
  });
});
