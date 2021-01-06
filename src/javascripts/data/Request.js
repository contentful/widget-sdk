import wrapWithRetry from 'data/Request/Retry';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
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

export default function makeRequest(auth) {
  if (!withRetry) {
    withRetry = wrapWithRetry(fetchFn);
  }
  return wrapWithCounter(wrapWithAuth(auth, withRetry));
}

async function fetchFn(config) {
  const args = buildRequestArguments(config);
  let rawResponse;

  try {
    rawResponse = await window.fetch(...args);
  } catch {
    // Network problem
    throw Object.assign(new Error('API request failed'), { status: -1, config });
  }

  let data = null;

  // 204 statuses are empty, so don't attempt to get the response body
  if (rawResponse.status !== 204) {
    data = await safelyGetResponseBody(rawResponse);
  }

  // matching AngularJS's $http response object
  // https://docs.angularjs.org/api/ng/service/$http#$http-returns
  const response = {
    config,
    data,
    headers: fromPairs([...rawResponse.headers.entries()]),
    status: rawResponse.status,
    statusText: rawResponse.statusText,
  };

  if (rawResponse.ok) {
    return response;
  } else {
    throw Object.assign(new Error('API request failed'), response);
  }
}

/**
 * Safely get the response data.
 *
 * If the response content type is JSON-like (e.g. application/vnd.contentful.management.v1+json),
 * the body will be parsed as JSON. Otherwise, it will be parsed as an array buffer. In both cases,
 * if parsing fails, `null` will be returned.
 *
 * @param  {Response} response       window.fetch response
 * @return {<Object|ArrayBuffer>?}   Parsed JSON, ArrayBuffer, or null
 */
async function safelyGetResponseBody(response) {
  const contentType = response.headers.get('Content-Type');

  let responseFn = 'json';

  if (!contentType.match(/json/)) {
    responseFn = 'arrayBuffer';
  }

  try {
    return await response[responseFn]();
  } catch {
    return null;
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
    });

    return request(args);
  };
}
