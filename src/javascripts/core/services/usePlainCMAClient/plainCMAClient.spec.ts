import { getCMAClient } from 'core/services/usePlainCMAClient/usePlainCMAClient';
/*
 * recreate behaviour as described here:
 * {@link} https://github.com/contentful/contentful-management.js/blob/master/test/unit/error-handler-test.js
 */

jest.mock('Authentication', () => ({
  getToken: jest.fn().mockResolvedValue(''),
  refreshToken: jest.fn().mockResolvedValue(''),
}));

const mockRequest = jest.fn(async () => ({ data: 'ResponseData' }));
jest.mock('data/Request', () => ({ makeRequest: jest.fn(() => mockRequest) }));

describe('A plain cma client instance', () => {
  it('can get many tags', async () => {
    const result = await getCMAClient().tag.getMany({ query: { limit: 100 } });
    expect(result).toBe('ResponseData');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', query: { limit: 100 } })
    );
  });

  it('can execute simple `GET` calls', async () => {
    const url = 'https://test.get';
    const result = await getCMAClient().raw.get(url);
    expect(result).toBe('ResponseData');
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url, method: 'GET' }));
  });
});
