/* global Headers */

import * as Telemetry from 'i13n/Telemetry';
import { getVariationSync } from 'core/feature-flags';
import { makeRequest } from './Request';
import wrapWithAuth from 'data/Request/Auth';
import { tracingHeaders } from 'i13n/BackendTracing';

const mockAuth = {};
const mockWithAuth =
  (_, fn) =>
  (...args) =>
    fn(...args);

jest.mock('data/Request/Retry', () => jest.fn(() => (config, fn) => fn(config)));
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
      text: jest.fn(async () => JSON.stringify({ foo: 'bar' })),
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
    }));
  });

  beforeEach(() => {
    request = makeRequest({ auth: mockAuth });
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
      rawResponse: expect.any(Object),
    });
  });

  it('rejects if the call to response.text throws', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => {
        throw new Error('Whoa');
      },
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
    });

    let response;

    try {
      response = await request({ url: 'http://foo.com' });
    } catch (err) {
      response = err;
    }

    expect(response).toBeInstanceOf(Error);
    expect(response.message).toBe('Whoa');

    expect({ ...response }).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/vnd.contentful.management.v1+json',
      },
      status: 200,
      statusText: 'OK',
      rawResponse: expect.any(Object),
    });
  });

  it('rejects if the data is not valid JSON', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => '{',
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      }),
    });

    let response;

    try {
      response = await request({ url: 'http://foo.com' });
    } catch (err) {
      response = err;
    }

    expect(response).toBeInstanceOf(Error);
    expect(response.message).toBe('Unexpected end of JSON input');

    expect({ ...response }).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/vnd.contentful.management.v1+json',
      },
      status: 200,
      statusText: 'OK',
      rawResponse: expect.any(Object),
    });
  });

  it('resolves if the body text is empty', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => '',
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
      rawResponse: expect.any(Object),
    });
  });

  it('rejects with relevant data', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'NOT FOUND',
      text: () => JSON.stringify({ message: 'Not found' }),
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
      rawResponse: expect.any(Object),
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
      rawResponse: expect.any(Object),
    });
  });

  it('rejects if the call to response.arrayBuffer throws', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => {
        throw new Error('ArrayBuffer whoa');
      },
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
        'Content-Type': 'application/pdf',
      }),
    });

    let response;

    try {
      response = await request({ url: 'http://foo.com' });
    } catch (err) {
      response = err;
    }

    expect(response).toBeInstanceOf(Error);
    expect(response.message).toBe('ArrayBuffer whoa');
    expect({ ...response }).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
        'content-type': 'application/pdf',
      },
      status: 200,
      statusText: 'OK',
      rawResponse: expect.any(Object),
    });
  });

  it('returns data as null if the status is 204', async () => {
    const arrayBufferFn = jest.fn();
    const jsonFn = jest.fn();

    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'OK',
      arrayBuffer: arrayBufferFn,
      json: jsonFn,
      headers: new Headers({
        'X-Contentful-Request-ID': 'reqid',
      }),
    });

    const response = await request({ url: 'http://foo.com' });

    expect(response).toEqual({
      config: { url: 'http://foo.com' },
      data: null,
      headers: {
        'x-contentful-request-id': 'reqid',
      },
      status: 204,
      statusText: 'OK',
      rawResponse: expect.any(Object),
    });
    expect(arrayBufferFn).not.toBeCalled();
    expect(jsonFn).not.toBeCalled();
  });

  it('tracks cma-req with default version', async () => {
    await request({ url: 'http://foo.com/spaces/hello-world/entries' });
    expect(Telemetry.count).toHaveBeenCalledTimes(1);
    expect(Telemetry.count).toHaveBeenCalledWith(
      'cma-req',
      expect.objectContaining({ version: 1 })
    );
  });

  it('tracks cma-req with version explicitly set to 2', async () => {
    getVariationSync.mockReturnValue(2);
    request = makeRequest({ auth: mockAuth });
    await request({ url: 'http://foo.com/spaces/hello-world/entries' });
    expect(Telemetry.count).toHaveBeenCalledTimes(1);
    expect(Telemetry.count).toHaveBeenCalledWith(
      'cma-req',
      expect.objectContaining({ version: 2 })
    );
  });
});
