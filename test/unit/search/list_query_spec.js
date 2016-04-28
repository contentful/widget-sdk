'use strict';

describe('ListQuery service', function () {
  var $q, ListQuery, spaceContext, searchQueryHelper;

  var OPTS = {
    order: { direction: 'descending', fieldId: 'updatedAt' },
    paginator: { pageLength: 30, skipItems: _.constant(0) },
    searchTerm: 'test'
  };

  function testQuery(q) {
    expect(q.order).toBe('-sys.updatedAt');
    expect(q.limit).toBe(30);
    expect(q.skip).toBe(0);
    expect(q.query).toBe('test');
    expect(q['sys.archivedAt[exists]']).toBe('false');
  }

  beforeEach(function () {
    module('contentful/test');
    $q = this.$inject('$q');
    ListQuery = this.$inject('ListQuery');
    spaceContext = this.$inject('spaceContext');
    searchQueryHelper = this.$inject('searchQueryHelper');

    spaceContext.fetchPublishedContentType = sinon.stub().resolves({
      data: { fields: [] }, getId: _.constant('test')
    });
  });

  describe('Returns promise of a query', function () {
    pit('for assets', function () {
      sinon.stub(searchQueryHelper.assetContentType, 'getId');

      return ListQuery.getForAssets(OPTS).then(function (q) {
        testQuery(q);
        expect(q.content_type).toBeUndefined();
        sinon.assert.called(searchQueryHelper.assetContentType.getId);
      });
    });

    pit('for entries', function () {
      return ListQuery.getForEntries(_.extend({ contentTypeId: 'test' }, OPTS))
      .then(function (q) {
        testQuery(q);
        expect(q.content_type).toBe('test');
      });
    });
  });

  describe('special search terms', function () {
    function queryFor(term) {
      return ListQuery.getForEntries(_.extend({contentTypeId: 'test'}, OPTS, {searchTerm  : term}));
    }

    pit('for published list', function() {
      return queryFor('status:published').then(function (q) {
        expect(q['sys.publishedAt[exists]']).toBe('true');
      });
    });

    pit('for changed list', function() {
      return queryFor('status:changed').then(function (q) {
        expect(q['sys.archivedAt[exists]']).toBe('false');
        expect(q.changed).toBe('true');
      });
    });

    pit('for draft list', function() {
      return queryFor('status:draft').then(function (q) {
        expect(q['sys.archivedAt[exists]']).toBe('false');
        expect(q['sys.publishedVersion[exists]']).toBe('false');
        expect(q.changed).toBe('true');
      });
    });

    it('for archived list', function() {
      return queryFor('status:archived').then(function (q) {
        expect(q['sys.archivedAt[exists]']).toBe('true');
      });
    });
  });
});
