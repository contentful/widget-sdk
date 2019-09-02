import { $initialize, $inject } from 'test/helpers/helpers';
import { it } from 'test/helpers/dsl';

describe('ListQuery service', () => {
  let ListQuery, paginator;
  afterEach(() => {
    ListQuery = paginator = null;
  });

  function testQuery(q) {
    expect(q.order).toBe('-sys.updatedAt');
    expect(q.limit).toBe(40);
    expect(q.skip).toBe(0);
    expect(q.query).toBe('test');
    expect(q['sys.archivedAt[exists]']).toBe('false');
  }

  beforeEach(async function() {
    paginator = (await this.system.import('classes/Paginator.es6')).default.create();

    await $initialize(this.system);

    ListQuery = $inject('ListQuery');

    const spaceContext = $inject('mocks/spaceContext').init();
    spaceContext.publishedCTs.fetch.resolves({
      data: { fields: [] },
      getId: () => 'test'
    });
  });

  function assetOpts(more) {
    return Object.assign(
      {
        order: { direction: 'descending', fieldId: 'updatedAt' },
        searchText: 'test',
        paginator
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
