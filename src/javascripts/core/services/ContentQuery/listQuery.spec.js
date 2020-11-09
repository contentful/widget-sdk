import * as ListQuery from './listQuery';
import Paginator from 'classes/Paginator';

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
        paginator: Paginator.create(),
      },
      more
    );
  }
  function entryOpts(more) {
    return assetOpts(Object.assign({ contentTypeId: 'TEST_CT_ID' }, more));
  }

  describe('Returns promise of a query', () => {
    it('for assets', function () {
      const q = ListQuery.getForAssets({ opts: assetOpts() });
      testQuery(q);
      expect(q.content_type).toBeUndefined();
    });

    it('for entries', function () {
      const q = ListQuery.getForEntries({ opts: entryOpts(), contentTypes: [] });
      testQuery(q);
      expect(q.content_type).toBe('TEST_CT_ID');
    });
  });

  describe('special search terms', () => {
    function queryFor(search) {
      return ListQuery.getForEntries({ opts: entryOpts(search), contentTypes: [] });
    }
    function searchForStatus(status) {
      return { searchFilters: [['__status', '', status]] };
    }

    it('for published list', function () {
      const q = queryFor(searchForStatus('published'));
      expect(q['sys.publishedAt[exists]']).toBe('true');
    });

    it('for changed list', function () {
      const q = queryFor(searchForStatus('changed'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for draft list', function () {
      const q = queryFor(searchForStatus('draft'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q['sys.publishedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for archived list', function () {
      const q = queryFor(searchForStatus('archived'));
      expect(q['sys.archivedAt[exists]']).toBe('true');
    });
  });
});
