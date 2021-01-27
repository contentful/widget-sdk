import _ from 'lodash';
import * as EntityResolver from './EntityResolver';
import { getModule } from 'core/NgRegistry';

import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
getModule.mockReturnValue(spaceContextMocked);

describe('EntityResolver', () => {
  it('fetches each ID', async () => {
    const ids = ['a', 'b', 'c'];
    const entities = [];
    spaceContextMocked.cma.getEntries.mockResolvedValueOnce({ items: entities });

    const results = await EntityResolver.fetchForType('Entry', ids);

    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.join(','),
    });

    expect(results).toEqual(entities);
  });

  it('splits queries for more than 50 ids', async () => {
    const ids = _.range(51);

    await EntityResolver.fetchForType('Entry', ids);

    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledTimes(2);
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.slice(0, 50).join(','),
    });
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.slice(50).join(','),
    });
  });

  it('returns empty list if response is 404', async () => {
    spaceContextMocked.cma.getEntries.mockRejectedValueOnce({ status: 404 });
    const ids = ['a', 'b', 'c'];

    const results = await EntityResolver.fetchForType('Entry', ids);

    expect(results).toEqual([]);
  });

  it('splits queries if server returns response too big error', async () => {
    const entities1 = ['a', 'b', 'c', 'd'];
    const entities2 = ['1', '2', '3'];

    spaceContextMocked.cma.getEntries
      .mockRejectedValueOnce({ status: 400, data: { message: 'Response size too big' } })
      .mockResolvedValueOnce({ items: entities1 })
      .mockResolvedValueOnce({ items: entities2 });
    const ids = ['a', 'b', 'c', 'd', '1', '2', '3'];

    const results = await EntityResolver.fetchForType('Entry', ids);
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledTimes(3);
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': ids.join(','),
    });
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': entities1.join(','),
    });
    expect(spaceContextMocked.cma.getEntries).toHaveBeenCalledWith({
      'sys.id[in]': entities2.join(','),
    });
    expect(results).toEqual(ids);
  });
});
