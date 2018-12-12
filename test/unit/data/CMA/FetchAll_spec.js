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
      this.endpointStub = sinon.stub().resolves(this.response);
    });

    it('fetches the first page', function() {
      this.fetchAll(this.endpointStub, '/path', this.query.limit);
      sinon.assert.calledOnce(
        this.endpointStub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
    });

    it('resolves and returns the results', async function() {
      const result = await this.fetchAll(this.endpointStub, '/path', this.query.limit);
      expect(result).toEqual(this.response.items);
    });

    it('sends custom query parameters', async function() {
      await this.fetchAll(this.endpointStub, '/path', this.query.limit, { foo: 42 });
      sinon.assert.called(
        this.endpointStub.withArgs({
          method: 'GET',
          path: '/path',
          query: { skip: 0, limit: 10, foo: 42 }
        })
      );
    });
  });

  describe('when there is more than one page of results', () => {
    it('fetches all pages', async function() {
      const endpointStub = sinon.stub().resolves({ total: 15, items: [{ sys: { id: 'a' } }] });

      await this.fetchAll(endpointStub, '/path', this.query.limit);

      sinon.assert.called(
        endpointStub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
      sinon.assert.called(
        endpointStub.withArgs({ method: 'GET', path: '/path', query: { skip: 10, limit: 10 } })
      );
      sinon.assert.calledTwice(endpointStub);
    });

    it('resolves and returns all results', async function() {
      const endpointStub = sinon.stub();
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
      endpointStub.resolves(results.pageOne);
      endpointStub.onCall(1).returns(results.pageTwo);

      const expectedResults = _(results)
        .map('items')
        .flatten()
        .value();
      const result = await this.fetchAll(endpointStub, '/path', this.query.limit);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('when there are duplicate resources in the API response', () => {
    it('returns only unique resources', async function() {
      const response = {
        total: 3,
        items: [{ sys: { id: 'abc' } }, { sys: { id: 'abc' } }, { sys: { id: 'def' } }]
      };
      const endpointStub = sinon.stub().resolves(response);
      const result = await this.fetchAll(endpointStub, '/path', this.query.limit);
      const expectedResults = [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }];

      expect(result).toEqual(expectedResults);
    });
  });

  describe('#fetchAllWithIncludes', () => {
    beforeEach(function() {
      this.response = { total: 10, items: [{ sys: { id: 'sysId' } }] };
      this.endpointStub = sinon.stub().resolves(this.response);
    });

    it('fetches once if total is lte to batchLimit', function() {
      this.fetchAllWithIncludes(this.endpointStub, '/path', this.query.limit);
      sinon.assert.calledOnce(
        this.endpointStub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
    });

    it('resolves with results', async function() {
      const result = await this.fetchAllWithIncludes(this.endpointStub, '/path', this.query.limit);
      expect(result).toEqual({
        total: 1,
        items: this.response.items,
        includes: {}
      });
    });

    it('sends custom query parameters', async function() {
      await this.fetchAllWithIncludes(this.endpointStub, '/path', this.query.limit, {
        customParam: true
      });
      sinon.assert.called(
        this.endpointStub.withArgs({
          method: 'GET',
          path: '/path',
          query: { skip: 0, limit: 10, customParam: true }
        })
      );
    });

    it('fetches all pages', function() {
      const endpointStub = sinon.stub().resolves({ total: 15, items: [{ sys: { id: 'a' } }] });

      this.fetchAllWithIncludes(endpointStub, '/path', this.query.limit);
      this.$apply();

      sinon.assert.called(
        endpointStub.withArgs({ method: 'GET', path: '/path', query: this.query })
      );
      sinon.assert.called(
        endpointStub.withArgs({ method: 'GET', path: '/path', query: { skip: 10, limit: 10 } })
      );
      sinon.assert.calledTwice(endpointStub);
    });

    it('resolves and returns all results', async function() {
      const endpointStub = sinon.stub();
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
      endpointStub.onCall(0).resolves(results.first);
      endpointStub.onCall(1).resolves(results.second);

      const expectedResult = {
        total: 4, // The total comes from the actual items length, not the total key value sum
        items: results.first.items.concat(results.second.items),
        includes: {}
      };
      const result = await this.fetchAllWithIncludes(endpointStub, '/path', this.query.limit);

      expect(result).toEqual(expectedResult);
    });

    it('resolves with includes from multiple responses', async function() {
      const endpointStub = sinon.stub();
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
      endpointStub.onCall(0).resolves(results.first);
      endpointStub.onCall(1).resolves(results.second);

      const expectedResult = {
        total: 4,
        items: results.first.items.concat(results.second.items),
        includes: {
          User: results.first.includes.User.concat(results.second.includes.User),
          Space: results.first.includes.Space.concat(results.second.includes.Space)
        }
      };
      const result = await this.fetchAllWithIncludes(endpointStub, '/path', this.query.limit);

      expect(result).toEqual(expectedResult);
    });
  });
});
