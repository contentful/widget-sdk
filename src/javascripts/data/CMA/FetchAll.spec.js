import { waitFor } from '@testing-library/dom';
import _ from 'lodash';
import { fetchAll, fetchAllWithIncludes } from './FetchAll';

const mockIdentity = _.identity;
jest.mock('lodash/debounce', () => ({ default: mockIdentity }));
jest.mock('lodash/throttle', () => ({ default: mockIdentity }));

describe('FetchAll', () => {
  let query, response, endpointStub;
  beforeEach(async function () {
    query = { skip: 0, limit: 10 };
  });

  describe('when there is only one page of results', () => {
    beforeEach(function () {
      response = { total: 10, items: [{ sys: { id: 'sysId' } }] };
      endpointStub = jest.fn().mockResolvedValue(response);
    });

    it('fetches the first page', function () {
      fetchAll(endpointStub, '/path', query.limit);
      expect(endpointStub).toHaveBeenCalled();
      expect(endpointStub).toHaveBeenCalledWith(
        { method: 'GET', path: '/path', query: query },
        undefined
      );
    });

    it('resolves and returns the results', async function () {
      const result = await fetchAll(endpointStub, '/path', query.limit);
      expect(result).toEqual(response.items);
    });

    it('sends custom query parameters', async function () {
      await fetchAll(endpointStub, '/path', query.limit, { foo: 42 });
      expect(endpointStub).toHaveBeenCalled();
      expect(endpointStub).toHaveBeenCalledWith(
        {
          method: 'GET',
          path: '/path',
          query: { skip: 0, limit: 10, foo: 42 },
        },
        undefined
      );
    });
  });

  describe('when there is more than one page of results', () => {
    it('fetches all pages', async function () {
      const endpointStub = jest
        .fn()
        .mockResolvedValue({ total: 15, items: [{ sys: { id: 'a' } }] });

      await fetchAll(endpointStub, '/path', query.limit);

      expect(endpointStub).toHaveBeenNthCalledWith(
        1,
        {
          method: 'GET',
          path: '/path',
          query: query,
        },
        undefined
      );
      expect(endpointStub).toHaveBeenNthCalledWith(
        2,
        {
          method: 'GET',
          path: '/path',
          query: { skip: 10, limit: 10 },
        },
        undefined
      );
      expect(endpointStub).toHaveBeenCalledTimes(2);
    });

    it('resolves and returns all results', async function () {
      const endpointStub = jest.fn();
      const results = {
        pageOne: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }],
        },
        pageTwo: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }],
        },
      };
      endpointStub.mockResolvedValueOnce(results.pageOne);
      endpointStub.mockReturnValueOnce(results.pageTwo);

      const expectedResults = _(results).map('items').flatten().value();
      const result = await fetchAll(endpointStub, '/path', query.limit);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('when there are duplicate resources in the API response', () => {
    it('returns only unique resources', async function () {
      const response = {
        total: 3,
        items: [{ sys: { id: 'abc' } }, { sys: { id: 'abc' } }, { sys: { id: 'def' } }],
      };
      const endpointStub = jest.fn().mockResolvedValue(response);
      const result = await fetchAll(endpointStub, '/path', query.limit);
      const expectedResults = [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }];

      expect(result).toEqual(expectedResults);
    });
  });

  describe('#fetchAllWithIncludes', () => {
    beforeEach(function () {
      response = { total: 10, items: [{ sys: { id: 'sysId' } }] };
      endpointStub = jest.fn().mockResolvedValue(response);
    });

    it('fetches once if total is lte to batchLimit', function () {
      fetchAllWithIncludes(endpointStub, '/path', query.limit);
      expect(endpointStub).toHaveBeenCalled();
      expect(endpointStub).toHaveBeenCalledWith(
        { method: 'GET', path: '/path', query: query },
        undefined
      );
    });

    it('resolves with results', async function () {
      const result = await fetchAllWithIncludes(endpointStub, '/path', query.limit);
      expect(result).toEqual(
        {
          total: 1,
          items: response.items,
          includes: {},
        },
        undefined
      );
    });

    it('sends custom query parameters', async function () {
      await fetchAllWithIncludes(endpointStub, '/path', query.limit, {
        customParam: true,
      });
      expect(endpointStub).toHaveBeenCalled();
      expect(endpointStub).toHaveBeenCalledWith(
        {
          method: 'GET',
          path: '/path',
          query: { skip: 0, limit: 10, customParam: true },
        },
        undefined
      );
    });

    it('fetches all pages', async function () {
      const endpointStub = jest
        .fn()
        .mockResolvedValue({ total: 15, items: [{ sys: { id: 'a' } }] });

      fetchAllWithIncludes(endpointStub, '/path', query.limit);

      await waitFor(() => {
        expect(endpointStub).toHaveBeenCalledTimes(2);
      });
      expect(endpointStub).toHaveBeenNthCalledWith(
        1,
        {
          method: 'GET',
          path: '/path',
          query: query,
        },
        undefined
      );
      expect(endpointStub).toHaveBeenNthCalledWith(
        2,
        {
          method: 'GET',
          path: '/path',
          query: { skip: 10, limit: 10 },
        },
        undefined
      );
    });

    it('resolves and returns all results', async function () {
      const endpointStub = jest.fn();
      const results = {
        first: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }],
        },
        second: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }],
        },
      };
      endpointStub.mockResolvedValueOnce(results.first);
      endpointStub.mockResolvedValueOnce(results.second);

      const expectedResult = {
        total: 4, // The total comes from the actual items length, not the total key value sum
        items: results.first.items.concat(results.second.items),
        includes: {},
      };
      const result = await fetchAllWithIncludes(endpointStub, '/path', query.limit);

      expect(result).toEqual(expectedResult);
    });

    it('resolves with includes from multiple responses', async function () {
      const endpointStub = jest.fn();
      const results = {
        first: {
          total: 15,
          items: [{ sys: { id: 'abc' } }, { sys: { id: 'def' } }],
          includes: {
            User: [{ sys: { id: 'user_1234' } }],
            Space: [{ sys: { id: 'space_1234' } }],
          },
        },
        second: {
          total: 15,
          items: [{ sys: { id: 'ghi' } }, { sys: { id: 'jkl' } }],
          includes: {
            User: [{ sys: { id: 'user_5678' } }],
            Space: [{ sys: { id: 'space_5678' } }],
          },
        },
      };
      endpointStub.mockResolvedValueOnce(results.first);
      endpointStub.mockResolvedValueOnce(results.second);

      const expectedResult = {
        total: 4,
        items: results.first.items.concat(results.second.items),
        includes: {
          User: results.first.includes.User.concat(results.second.includes.User),
          Space: results.first.includes.Space.concat(results.second.includes.Space),
        },
      };
      const result = await fetchAllWithIncludes(endpointStub, '/path', query.limit);

      expect(result).toEqual(expectedResult);
    });
  });
});
