import _ from 'lodash';
import * as EntityResolver from './EntityResolver';

import * as spaceContextMocked from 'ng/spaceContext';

describe('EntityResolver', () => {
  it('fetches each ID', async function() {
    const ids = ['a', 'b', 'c'];
    const entities = [];
    spaceContextMocked.cma.getEntries.mockResolvedValueOnce({ items: entities });

    const results = await EntityResolver.fetchForType(spaceContextMocked, 'Entry', ids);

    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.join(',')
    });

    expect(results).toEqual(entities);
  });

  it('splits queries for more than 50 ids', async function() {
    const ids = _.range(51);

    await EntityResolver.fetchForType(spaceContextMocked, 'Entry', ids);

    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledTimes(2);
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.slice(0, 50).join(',')
    });
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.slice(50).join(',')
    });
  });

  it('returns empty list if response is 404', async function() {
    spaceContextMocked.cma.getEntries.mockRejectedValueOnce({ status: 404 });
    const ids = ['a', 'b', 'c'];

    const results = await EntityResolver.fetchForType(spaceContextMocked, 'Entry', ids);

    expect(results).toEqual([]);
  });
});
