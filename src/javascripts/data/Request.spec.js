/* global Headers */

import makeRequest from './Request';
import wrapWithAuth from 'data/Request/Auth';

const mockAuth = {};
const mockWithAuth = (_, fn) => (...args) => fn(...args);

jest.mock('data/Request/Retry', () => jest.fn((fn) => (...args) => fn(...args)));
jest.mock('data/Request/Auth', () => jest.fn());
jest.mock('data/Request/Utils', () => ({
  getEndpoint: jest.fn(),
  getCurrentState: jest.fn(),
}));

wrapWithAuth.mockImplementation(mockWithAuth);

describe('Request', () => {
  let request;

  beforeAll(() => {
    window.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn(async () => ({ foo: 'bar' })),
      headers: new Headers({ 'X-Contentful-Request-ID': 'reqid' }),
    }));
  });

  beforeEach(() => {
    request = makeRequest(mockAuth);
  });

  it('enhances the request', async () => {
    await request({ url: 'http://foo.com' });

    expect(wrapWithAuth).toHaveBeenCalledWith(mockAuth, expect.any(Function));
  });

  it('builds a query string', async () => {
    const params = {
      url: 'http://foo.com',
      query: { foo: 'bar', include: ['fuzz', 'buzz'] },
    };
    await request(params);

    expect(window.fetch).toHaveBeenCalledWith(
      'http://foo.com?foo=bar&include=fuzz,buzz',
      expect.any(Object)
    );
  });

  it('sends correct headers', async () => {
    await request({ url: 'http://foo.com' });
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-User-Agent': expect.any(String),
        },
      })
    );
  });

  it('sends the body as JSON', async () => {
    await request({ url: 'http://foo.com', method: 'POST', body: { name: 'Contentful' } });
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: '{"name":"Contentful"}',
      })
    );
  });

  it('returns data', async () => {
    const response = await request({ url: 'http://foo.com' });
    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: { foo: 'bar' },
      headers: { 'x-contentful-request-id': 'reqid' },
      status: 200,
      statusText: 'OK',
    });
  });

  it('handles responses without a body', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => {
        throw {};
      },
      headers: new Headers({ 'X-Contentful-Request-ID': 'reqid' }),
    });
    const response = await request({ url: 'http://foo.com' });
    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: { 'x-contentful-request-id': 'reqid' },
      status: 200,
      statusText: 'OK',
    });
  });

  it('rejects with relevant data', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'NOT FOUND',
      json: () => ({ message: 'Not found' }),
      headers: new Headers({ 'X-Contentful-Request-ID': 'reqid' }),
    });
    let response;

    try {
      await request({ url: 'http://foo.com' });
    } catch (e) {
      response = e;
    }
    expect(response).toBeInstanceOf(Error);
    expect(response.message).toBe('API request failed');
    expect({ ...response }).toEqual({
      config: { url: 'http://foo.com' },
      data: { message: 'Not found' },
      headers: { 'x-contentful-request-id': 'reqid' },
      status: 404,
      statusText: 'NOT FOUND',
    });
  });

  it('rejects with preflight error', async () => {
    window.fetch.mockRejectedValueOnce(new Error('Network problem'));

    let response;

    try {
      await request({ url: 'http://foo.com' });
    } catch (e) {
      response = e;
    }

    expect(response).toBeInstanceOf(Error);
    expect(response.message).toBe('API request failed');
    expect({ ...response }).toEqual({
      config: { url: 'http://foo.com' },
      status: -1,
    });
  });
});
