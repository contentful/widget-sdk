/* global Headers */

import makeRequest from './Request';
import wrapWithAuth from 'data/Request/Auth';
import { tracingHeaders } from 'i13n/BackendTracing';

const mockAuth = {};
const mockWithAuth = (_, fn) => (...args) => fn(...args);

jest.mock('data/Request/Retry', () => jest.fn((fn) => (...args) => fn(...args)));
jest.mock('data/Request/Auth', () => jest.fn());
jest.mock('data/Request/Utils', () => ({
  getEndpoint: jest.fn(),
  getCurrentState: jest.fn(),
}));
jest.mock('i13n/BackendTracing', () => ({ tracingHeaders: jest.fn() }));

wrapWithAuth.mockImplementation(mockWithAuth);

describe('Request', () => {
  let request;

  beforeAll(() => {
    window.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn(async () => ({ foo: 'bar' })),
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
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

  it('sends tracing headers when present', async () => {
    tracingHeaders.mockReturnValue({ 'cf-trace': 'zd-1234' });
    await request({ url: 'http://foo.com' });
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-User-Agent': expect.any(String),
          'cf-trace': 'zd-1234',
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
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/vnd.contentful.management.v1+json',
      },
      status: 200,
      statusText: 'OK',
    });
  });

  it('handles if the call to response.json throws', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => {
        throw {};
      },
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
    });
    const response = await request({ url: 'http://foo.com' });
    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/vnd.contentful.management.v1+json',
      },
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
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
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
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/vnd.contentful.management.v1+json',
      },
      status: 404,
      statusText: 'NOT FOUND',
    });
  });

  it('handles non-JSON responses', async () => {
    const arrayBuffer = new ArrayBuffer([1, 2, 3, 4]);

    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => arrayBuffer,
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/pdf',
      }),
    });

    const response = await request({ url: 'http://foo.com' });

    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: arrayBuffer,
      headers: { 'x-contentful-request-id': 'reqid', 'content-type': 'application/pdf' },
      status: 200,
      statusText: 'OK',
    });
  });

  it('handles if the call to response.arrayBuffer throws', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => {
        throw {};
      },
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/pdf',
      }),
    });

    const response = await request({ url: 'http://foo.com' });

    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/pdf',
      },
      status: 200,
      statusText: 'OK',
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
