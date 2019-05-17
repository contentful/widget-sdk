'use strict';

const lodash = require('lodash');
const { handle } = require('./index');

const testUser = {
  token: 'CFPAT-123456',
  spaceId: '456bar',
  membershipId: '987foo',
  algoliaAppId: 'yolo',
  algoliaAPIKey: 'span-eggs'
};

// Define responses for requests matched by HTTPIE style request definitions
// e.g POST https://api.contentful.com/token
// e.g PUT https://api.algolia.com/query X-Algolia-API-Key:foobar
const MOCK_REQUESTS = [
  {
    match: 'GET https://api.contentful.com/token',
    response: {
      includes: {
        SpaceMember: [
          {
            admin: true,
            sys: {
              id: testUser.membershipId,
              space: {
                sys: {
                  id: testUser.spaceId
                }
              }
            }
          }
        ]
      }
    }
  },
  {
    match: `POST https://${
      testUser.algoliaAppId
    }-dsn.algolia.net/1/indexes/testing/query X-Algolia-API-Key:${testUser.algoliaAPIKey}`,
    response: {
      hits: [{ hello: 'world' }]
    }
  }
];

describe('handler', () => {
  it('may return 404', async () => {
    const result = await handle({
      req: mockRequest({ method: 'GET', path: '/' }),
      kv: mockKv(),
      dependencies: mockDependencies()
    });

    // `/` should return a 404
    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual('{"message":"Not found."}');
    expect(result.headers['Content-Type']).toEqual('application/json');
  });

  it('writes algolia configuration with secrets to given space', async () => {
    const body = {
      'content-types': ['foo', 'bar'],
      secrets: {
        'api-key': 'foo',
        'api-secret': 'bar'
      }
    };

    const result = await handle({
      req: mockRequest({ method: 'PUT', path: `/spaces/${testUser.spaceId}/algolia`, body }),
      kv: mockKv(),
      dependencies: mockDependencies()
    });

    // We expect a response with 200 status code
    expect(result.statusCode).toEqual(200);
    expect(result.headers['Content-Type']).toEqual('application/json');

    // Response includes a body field with JSON contents
    const responseBody = JSON.parse(result.body);

    // secrets should be sanitized out from the response
    expect(responseBody.algolia.secrets).toBeUndefined();

    // The rest of the properties should be included
    expect(responseBody.algolia['content-types'].length).toEqual(2);
    expect(responseBody.algolia['content-types'][0]).toEqual('foo');
    expect(responseBody.algolia['content-types'][1]).toEqual('bar');
  });

  it('reads algolia configuration with secrets from given space', async () => {
    // Define a sample algolia configuration that will be stored before reading
    const initialConfig = {
      'content-types': ['foo', 'bar'],
      secrets: {
        'api-key': testUser.algoliaAPIKey,
        'app-id': testUser.algoliaAppId
      }
    };

    const kvStore = mockKv();

    // Now write the sample config to the space
    await handle({
      req: mockRequest({
        method: 'PUT',
        path: `/spaces/${testUser.spaceId}/algolia`,
        body: initialConfig
      }),
      kv: kvStore,
      dependencies: mockDependencies()
    });

    // Send another request to read the config that has just written
    const result = await handle({
      req: mockRequest({ method: 'GET', path: `/spaces/${testUser.spaceId}` }),
      kv: kvStore,
      dependencies: mockDependencies()
    });

    // We expect a response with 200 status code
    expect(result.statusCode).toEqual(200);
    expect(result.headers['Content-Type']).toEqual('application/json');

    // Response includes a body field with JSON contents
    const responseBody = JSON.parse(result.body);

    // secrets should be sanitized out from the response
    expect(responseBody.algolia.secrets).toBeUndefined();

    // The rest of the properties should be included
    expect(responseBody.algolia['content-types'].length).toEqual(2);
    expect(responseBody.algolia['content-types'][0]).toEqual('foo');
    expect(responseBody.algolia['content-types'][1]).toEqual('bar');
  });

  it('create a proxy request with saved Algolia secrets', async () => {
    // Define the secrets that will be used for sending request to Algolia
    const algoliaConfig = {
      secrets: {
        'api-key': testUser.algoliaAPIKey,
        'app-id': testUser.algoliaAppId
      }
    };

    const kvStore = mockKv();

    // Now write the secrets to the space
    await handle({
      req: mockRequest({
        method: 'PUT',
        path: `/spaces/${testUser.spaceId}/algolia`,
        body: algoliaConfig
      }),
      kv: kvStore,
      dependencies: mockDependencies()
    });

    const requestOptions = {
      url: `https://${testUser.algoliaAppId}-dsn.algolia.net/1/indexes/testing/query`,
      method: 'POST',
      body: {
        params: 'query=world'
      },
      headers: {
        'X-Algolia-API-Key': '{api-key}'
      }
    };

    // Create a proxy request to Algolia using the secrets defined above
    const result = await handle({
      req: mockRequest({
        method: 'POST',
        path: `/spaces/${testUser.spaceId}/algolia/request`,
        body: requestOptions
      }),
      kv: kvStore,
      dependencies: mockDependencies()
    });

    // We expect a response with 200 status code
    expect(result.statusCode).toEqual(200);
    expect(result.headers['Content-Type']).toEqual('application/json');

    // Response body contains the response we got from proxy request
    const responseBody = JSON.parse(result.body);
    expect(responseBody.status).toEqual(200);

    // The body field of the response is what proxy request received.
    const proxyResponseBody = JSON.parse(responseBody.body);
    expect(proxyResponseBody.hits.length).toEqual(1);
    expect(proxyResponseBody.hits[0].hello).toEqual('world');
  });
});

function mockRequest({ method, path, body, headers }) {
  return {
    path,
    method,
    body,
    headers: {
      'x-contentful-token': testUser.token,
      ...headers
    }
  };
}

function mockKv() {
  const store = {};

  return {
    get: key => store[key],
    set: (key, value) => {
      store[key] = value;
    }
  };
}

function mockDependencies() {
  return {
    lodash,
    fetch: mockFetch
  };
}

function mockFetch(url, options) {
  const request = findMockRequest(url, options);

  return new Promise((resolve, reject) => {
    if (!request) {
      return reject(new Error('Not found'));
    }

    resolve({
      status: 200,
      json,
      text
    });
  });

  function json() {
    return new Promise(resolve => resolve(request.response));
  }

  function text() {
    return new Promise(resolve => resolve(JSON.stringify(request.response)));
  }
}

function findMockRequest(url, options) {
  // Generate HTTPIE style keys from request options. Keep it as array as we want to match headers optionally.
  let key = [options.method || 'GET', url];
  if (options.headers) {
    key = key.concat(Object.keys(options.headers).map(key => `${key}:${options.headers[key]}`));
  }

  return MOCK_REQUESTS.find(req => {
    // Match method and url, or method, url and heades
    return req.match === key.slice(0, 2).join(' ') || req.match === key.join(' ');
  });
}
