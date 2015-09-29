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
  }

  beforeEach(function () {
    module('contentful/test');
    $q = this.$inject('$q');
    ListQuery = this.$inject('ListQuery');
    spaceContext = this.$inject('spaceContext');
    searchQueryHelper = this.$inject('searchQueryHelper');
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
      var ctPromise = $q.when({ data: { fields: [] }, getId: _.constant('test') });
      sinon.stub(spaceContext, 'fetchPublishedContentType').returns(ctPromise);

      return ListQuery.getForEntries(_.extend({ contentTypeId: 'test' }, OPTS))
      .then(function (q) {
        testQuery(q);
        expect(q.content_type).toBe('test');
      });
    });
  });
});
