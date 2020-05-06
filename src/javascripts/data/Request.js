import wrapWithRetry from 'data/Request/Retry';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import qs from 'qs';
import { gitRevision, env } from 'Config';
import { toPairs, fromPairs } from 'lodash';

/**
 * @description
 * Create a HTTP request function that handles authentication and
 * retries.
 *
 * The two parameters are provided by the 'Authentication' module.
 *
 * See the wrapper documentation for details.
 */
export default function makeRequest(auth) {
  return wrapWithCounter(wrapWithAuth(auth, wrapWithRetry(fetchFn)));
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

async function fetchFn(config) {
  const args = buildRequestArguments(config);
  const response = await window.fetch(...args);

  if (response.ok) {
    // 204s (or any response without payload) and .json() don't work well.
    // we return null in those cases.
    // we currently only accept JSON responses
    try {
      return await response.json();
    } catch {
      return null;
    }
  } else {
    throw response;
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
    // $http sorts all the query params alphabetically
    // so contract tests compare the query string with what $http was doing
    const sorted = fromPairs(toPairs(query).sort());
    const stringified = qs.stringify(sorted, { arrayFormat: 'comma', encode: false });
    // contract tests run `encodeURI` to send it to PACT, so we do the same
    const queryString = encodeURI(stringified);
    return `${url}?${queryString}`;
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
  };
}
