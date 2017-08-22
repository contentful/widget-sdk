'use strict';

describe('search#buildQuery()', function () {
  beforeEach(function () {
    module('contentful/test');
    const buildQuery = this.$inject('search/queryBuilder');
    this.space = {};
    this.buildQuery = function (query) {
      return buildQuery(this.space, this.contentType, query);
    };
  });

  pit('builds ID query', function () {
    return this.buildQuery('id:MYID')
    .then(function (q) {
      expect(q['sys.id']).toEqual('MYID');
    });
  });
});
