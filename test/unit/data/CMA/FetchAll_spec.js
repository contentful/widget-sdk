import _ from 'lodash';

describe('FetchAll', () => {
  beforeEach(function() {
    module('contentful/test');
    this.fetchAll = this.$inject('data/CMA/FetchAll.es6').fetchAll;
    this.fetchAllWithIncludes = this.$inject('data/CMA/FetchAll.es6').fetchAllWithIncludes;
    this.query = { skip: 0, limit: 10 };
  });

  describe('when there is only one page of results', () => {
    beforeEach(function() {
      this.response = { total: 10, items: [{ sys: { id: 'sysId' } }] };
      this.stub = sinon.stub().resolves(this.response);
    });

    it('fetches the first page', function() {
      this.fetchAll(this.stub, '/path', this.query.limit);
      sinon.assert.calledOnce(
        this.stub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
    });

    it('resolves and returns the results', function*() {
      const result = yield this.fetchAll(this.stub, '/path', this.query.limit);
      expect(result).toEqual(this.response.items);
    });

    it('sends custom query parameters', function() {
      this.fetchAll(this.stub, '/path', this.query.limit, { foo: 42 });
      this.$apply();
      sinon.assert.called(
        this.stub.withArgs({ method: 'GET', path: '/path', query: { skip: 0, limit: 10, foo: 42 } })
      );
    });
  });

  describe('when there is more than one page of results', () => {
    it('fetches all pages', function() {
      const stub = sinon.stub().resolves({ total: 15, items: [{ sys: { id: 'a' } }] });

      this.fetchAll(stub, '/path', this.query.limit);
      this.$apply();

      sinon.assert.called(stub.withArgs({ method: 'GET', path: '/path', query: this.query }));
      sinon.assert.called(
        stub.withArgs({ method: 'GET', path: '/path', query: { skip: 10, limit: 10 } })
      );
      sinon.assert.calledTwice(stub);
    });

    it('resolves and returns all results', function*() {
      const stub = sinon.stub();
      const results = {
        pageOne: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }]
        },
        pageTwo: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }]
        }
      };
      stub.resolves(results.pageOne);
      stub.onCall(1).returns(results.pageTwo);

      const expectedResults = _(results)
        .map('items')
        .flatten()
        .value();
      const result = yield this.fetchAll(stub, '/path', this.query.limit);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('when there are duplicate resources in the API response', () => {
    it('returns only unique resources', function*() {
      const response = {
        total: 3,
        items: [{ sys: { id: 'abc' } }, { sys: { id: 'abc' } }, { sys: { id: 'def' } }]
      };
      const stub = sinon.stub().resolves(response);
      const result = yield this.fetchAll(stub, '/path', this.query.limit);
      const expectedResults = [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }];

      expect(result).toEqual(expectedResults);
    });
  });

  describe('#fetchAllWithIncludes', () => {
    beforeEach(function() {
      this.response = { total: 10, items: [{ sys: { id: 'sysId' } }] };
      this.stub = sinon.stub().resolves(this.response);
    });

    it('fetches once if total is lte to batchLimit', function() {
      this.fetchAllWithIncludes(this.stub, '/path', this.query.limit);
      sinon.assert.calledOnce(
        this.stub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
    });

    it('resolves with results', async function() {
      const result = await this.fetchAllWithIncludes(this.stub, '/path', this.query.limit);
      expect(result).toEqual({
        total: 1,
        items: this.response.items,
        includes: {}
      });
    });

    it('sends custom query parameters', function() {
      this.fetchAllWithIncludes(this.stub, '/path', this.query.limit, { customParam: true });
      this.$apply();
      sinon.assert.called(
        this.stub.withArgs({
          method: 'GET',
          path: '/path',
          query: { skip: 0, limit: 10, customParam: true }
        })
      );
    });

    it('fetches all pages', function() {
      const stub = sinon.stub().resolves({ total: 15, items: [{ sys: { id: 'a' } }] });

      this.fetchAllWithIncludes(stub, '/path', this.query.limit);
      this.$apply();

      sinon.assert.called(stub.withArgs({ method: 'GET', path: '/path', query: this.query }));
      sinon.assert.called(
        stub.withArgs({ method: 'GET', path: '/path', query: { skip: 10, limit: 10 } })
      );
      sinon.assert.calledTwice(stub);
    });

    it('resolves and returns all results', function*() {
      const stub = sinon.stub();
      const results = {
        first: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }]
        },
        second: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }]
        }
      };
      stub.onCall(0).resolves(results.first);
      stub.onCall(1).resolves(results.second);

      const expectedResult = {
        total: 4, // The total comes from the actual items length, not the total key value sum
        items: [].concat(results.first.items, results.second.items),
        includes: {}
      };
      const result = yield this.fetchAllWithIncludes(stub, '/path', this.query.limit);

      expect(result).toEqual(expectedResult);
    });

    it('resolves with includes from multiple responses', async function() {
      const stub = sinon.stub();
      const results = {
        first: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }],
          includes: {
            User: [{ sys: { id: 'user_1234' } }],
            Space: [{ sys: { id: 'space_1234' } }]
          }
        },
        second: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }],
          includes: {
            User: [{ sys: { id: 'user_5678' } }],
            Space: [{ sys: { id: 'space_5678' } }]
          }
        }
      };
      stub.onCall(0).resolves(results.first);
      stub.onCall(1).resolves(results.second);

      const expectedResult = {
        total: 4,
        items: [].concat(results.first.items, results.second.items),
        includes: {
          User: [].concat(results.first.includes.User, results.second.includes.User),
          Space: [].concat(results.first.includes.Space, results.second.includes.Space)
        }
      };
      const result = await this.fetchAllWithIncludes(stub, '/path', this.query.limit);

      expect(result).toEqual(expectedResult);
    });
  });
});
