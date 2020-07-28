import wrapWithRetry from 'data/Request/Retry';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import * as BackendTracing from 'i13n/BackendTracing';
import queryString from 'query-string';
import { gitRevision, env } from 'Config';
import { fromPairs } from 'lodash';

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

  const data = await safelyGetResponseBody(rawResponse);
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

// 204s (or any response without payload) and .json() don't work well.
// we return null in those cases.
async function safelyGetResponseBody(response) {
  try {
    return await response.json();
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

// these headers are sent in all requests
function getDefaultHeaders() {
  const userAgentParts = ['app contentful.web-app', 'platform browser'];

  // Add active git revision to headers
  if (gitRevision) {
    userAgentParts.push(`sha ${gitRevision}`);
  }

  // Add environment, so that local dev versus direct traffic can be differentiated
  if (env !== 'production') {
    userAgentParts.push(`env ${env}`);
  }

  return {
    // we should be accepting only application/json. this is left over from $http
    Accept: 'application/json, text/plain, */*',
    'X-Contentful-User-Agent': userAgentParts.join('; '),
    'Content-Type': 'application/vnd.contentful.management.v1+json',
    ...BackendTracing.tracingHeaders(),
  };
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
