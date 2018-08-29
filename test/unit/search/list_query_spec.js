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

  beforeEach(function() {
    module('contentful/test');

    ListQuery = this.$inject('ListQuery');
    paginator = this.$inject('Paginator').create();

    const spaceContext = this.$inject('mocks/spaceContext').init();
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
    it('for assets', function*() {
      const q = yield ListQuery.getForAssets(assetOpts());
      testQuery(q);
      expect(q.content_type).toBeUndefined();
    });

    it('for entries', function*() {
      const q = yield ListQuery.getForEntries(entryOpts());
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

    it('for published list', function*() {
      const q = yield queryFor(searchForStatus('published'));
      expect(q['sys.publishedAt[exists]']).toBe('true');
    });

    it('for changed list', function*() {
      const q = yield queryFor(searchForStatus('changed'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for draft list', function*() {
      const q = yield queryFor(searchForStatus('draft'));
      expect(q['sys.archivedAt[exists]']).toBe('false');
      expect(q['sys.publishedAt[exists]']).toBe('false');
      expect(q.changed).toBe('true');
    });

    it('for archived list', function*() {
      const q = yield queryFor(searchForStatus('archived'));
      expect(q['sys.archivedAt[exists]']).toBe('true');
    });
  });
});
