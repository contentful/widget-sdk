import _ from 'lodash';
import createCache from 'data/CMA/EntityPrefetchCache';

describe('data/CMA/EntityPrefetchCache', () => {
  let queryEntities, cache;
  beforeEach(() => {
    queryEntities = jest.fn((query) => {
      const ids = query['sys.id[in]'].split(',');
      return Promise.resolve(
        ids.map((id) => {
          return {
            data: { sys: { id: id } },
          };
        })
      );
    });
    cache = createCache(queryEntities);
  });

  it('prefetches entities', async function () {
    cache.set(['A', 'B']);
    expect(queryEntities).toHaveBeenCalledTimes(1);

    const a = await cache.get('A');
    expect(a.data.sys.id).toBe('A');
    const b = await cache.get('B');
    expect(b.data.sys.id).toBe('B');

    expect(queryEntities).toHaveBeenCalledTimes(1);
  });

  it('only loads ids not already in cache', async function () {
    cache.set(['A', 'B']);
    queryEntities.mockClear();
    cache.set(['B', 'X', 'Y']);
    expect(queryEntities).toHaveBeenCalledWith({ limit: 50, 'sys.id[in]': 'X,Y' });

    const x = await cache.get('X');
    expect(x.data.sys.id).toBe('X');
    const y = await cache.get('Y');
    expect(y.data.sys.id).toBe('Y');

    expect(queryEntities).toHaveBeenCalledTimes(1);
  });

  it('removes ids not required anymore', async function () {
    cache.set(['A', 'B']);
    cache.set(['B']);

    queryEntities.mockClear();
    const a = await cache.get('A');
    expect(a.data.sys.id).toBe('A');
    expect(queryEntities).toHaveBeenCalledTimes(1);
  });

  it('chunks up IDs', function () {
    const ids = _.range(101).map((i) => `id${i}`);
    cache.set(ids);
    expect(queryEntities).toHaveBeenCalledTimes(3);
  });
});
