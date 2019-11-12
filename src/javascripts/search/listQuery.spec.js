import * as ListQuery from './listQuery';
import Paginator from 'classes/Paginator';

jest.mock('ng/spaceContext', () => ({
  publishedCTs: {
    fetch: jest.fn().mockResolvedValue({
      data: { fields: [] },
      getId: () => 'test'
    })
  }
}));

describe('ListQuery service', () => {
  function testQuery(q) {
    expect(q.order).toBe('-sys.updatedAt');
    expect(q.limit).toBe(40);
    expect(q.skip).toBe(0);
    expect(q.query).toBe('test');
    expect(q['sys.archivedAt[exists]']).toBe('false');
  }

  function assetOpts(more) {
    return Object.assign(
      {
        order: { direction: 'descending', fieldId: 'updatedAt' },
        searchText: 'test',
        paginator: Paginator.create()
      },
      more
    );
  }
  function entryOpts(more) {
    return assetOpts(Object.assign({ contentTypeId: 'TEST_CT_ID' }, more));
  }

  describe('Returns promise of a query', () => {
    it('for assets', async function() {
      const q = await ListQuery.getForAssets(assetOpts());
      testQuery(q);
      expect(q.content_type).toBeUndefined();
    });

    it('for entries', async function() {
      const q = await ListQuery.getForEntries(entryOpts());
      testQuery(q);
      expect(q.content_type).toBe('TEST_CT_ID');
    });
  });

  describe('special search terms', () => {
    function queryFor(search) {
      return ListQuery.getForEntries(entryOpts(search));
    }
    function searchForStatus(status) {
      return { searchFilters: [['__status', '', status]] };
    }

    it('for published list', async function() {
      const q = await queryFor(searchForStatus('published'));
      expect(q['sys.publishedAt[exists]']).toBe('true');
    });

    it('for changed list', async function() {
      const q = await queryFor(searchForStatus('changed'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for draft list', async function() {
      const q = await queryFor(searchForStatus('draft'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q['sys.publishedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for archived list', async function() {
      const q = await queryFor(searchForStatus('archived'));
      expect(q['sys.archivedAt[exists]']).toBe('true');
    });
  });
});
