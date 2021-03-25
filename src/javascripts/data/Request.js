import wrapWithRetry from 'data/Request/Retry';
import wrapWithRetryWithQueue from 'data/Request/RetryWithQueue';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import { FLAGS, getVariationSync, hasCachedVariation } from 'LaunchDarkly';
import queryString from 'query-string';
import { fromPairs } from 'lodash';
import { getDefaultHeaders } from 'core/services/usePlainCMAClient/getDefaultClientHeaders';

/**
 * @description
 * Create a HTTP request function that handles authentication and
 * retries.
 *
 * The two parameters are provided by the 'Authentication' module.
 *
 * See the wrapper documentation for details.
 */

let withRetry;
let withRetryVersion = 1;

const RETRY_VERSION = {
  0: wrapWithRetry,
  1: wrapWithRetry,
  2: wrapWithRetryWithQueue,
};

function getRetryVersion() {
  if (!hasCachedVariation(FLAGS.REQUEST_RETRY_EXPERIMENT)) {
    return 0;
  }
  const variation = getVariationSync(FLAGS.REQUEST_RETRY_EXPERIMENT);
  return variation ? 2 : 1;
}

export default function makeRequest(auth) {
  const version = getRetryVersion();
  if (version !== withRetryVersion || !withRetry) {
    withRetry = RETRY_VERSION[version](fetchFn, version);
    withRetryVersion = version;
  }
  return wrapWithCounter(wrapWithAuth(auth, withRetry));
}

async function fetchFn(config) {
  const args = buildRequestArguments(config);
  let rawResponse;

  const asyncError = new Error('API request failed');

  try {
    rawResponse = await window.fetch(...args);
  } catch {
    // Network problem
    throw Object.assign(asyncError, {
      message: 'API request failed in preflight',
      status: -1,
      config,
    });
  }

  const response = {
    // matching AngularJS's $http response object
    // https://docs.angularjs.org/api/ng/service/$http#$http-returns
    config,
    data: null,
    headers: fromPairs([...rawResponse.headers.entries()]),
    status: rawResponse.status,
    statusText: rawResponse.statusText,

    // Non-AngularJS
    rawResponse,
  };

  // 204 statuses are empty, so don't attempt to get the response body
  if (rawResponse.status !== 204) {
    try {
      response.data = await getResponseBody(rawResponse);
    } catch (err) {
      // Make sure we capture both the original error and the response information
      Object.assign(err, response);

      throw err;
    }
  }

  if (rawResponse.ok) {
    return response;
  } else {
    throw Object.assign(asyncError, {
      message: 'API request failed',
      ...response,
    });
  }
}

/**
 * Get the response data.
 *
 * If the response content type is JSON-like (e.g. application/vnd.contentful.management.v1+json),
 * the body is checked for truthy-ness. If the body is truthy, it will be attempted to be parsed,
 * and if it is falsy, `null` will be returned.
 *
 * If the response content type is not JSON-like, the result will be an `ArrayBuffer` instance.
 *
 * If the response cannot be parsed (i.e. if it's not valid JSON), the error will be thrown,
 * rather than gracefully handled.
 *
 * @param  {Response} response       window.fetch response
 */
async function getResponseBody(response) {
  const contentType = response.headers.get('Content-Type');

  if (contentType.match(/json/)) {
    const body = await response.text();

    if (body) {
      return JSON.parse(body);
    } else {
      return null;
    }
  } else {
    return await response.arrayBuffer();
  }
}

// fetch requires the url as the first argument.
// we require `body` to be a JSON string
// we also send a special X-Contentful-User-Agent header
function buildRequestArguments(data) {
  const url = withQuery(data.url, data.query);
  const requestData = {
    ...data,
    body: data.body ? JSON.stringify(data.body) : null,
    headers: {
      ...getDefaultHeaders(),
      ...data.headers,
    },
  };

  return [url, requestData];
}

// convert request params to a query string and append it to the request url
function withQuery(url, query) {
  if (query) {
    // Our contract tests assert the queries as strings with keys in alphabetical order
    // Ideally our test should not care about the order
    const stringified = queryString.stringify(query, { arrayFormat: 'comma' });
    return `${url}?${stringified}`;
  }
  return url;
}

function wrapWithCounter(request) {
  return async (args) => {
    Telemetry.count('cma-req', {
      endpoint: getEndpoint(args.url),
      state: getCurrentState(),
      version: withRetryVersion,
    });

    return request(args);
  };
}
