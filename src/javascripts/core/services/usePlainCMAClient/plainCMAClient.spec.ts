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

  it('throws expected error', async () => {
    const response = {
      status: 500,
      statusText: '',
      data: {
        message: 'failed',
      },
    };

    const responseError = Object.assign(
      new Error('Request failed with status code ' + response.status),
      response
    );

    mockRequest.mockRejectedValueOnce(responseError);

    let error;
    try {
      await getCMAClient().raw.get('https://my.url');
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(responseError);
    expect(error instanceof Error).toBe(true);
    expect(error.status).toEqual(500);
    expect(error.message).toEqual('Request failed with status code 500');
  });
});
