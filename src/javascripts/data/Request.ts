import wrapWithRetry from 'data/Request/Retry';
import wrapWithRetryWithQueue from 'data/Request/RetryWithQueue';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import { FLAGS, getVariationSync, hasCachedVariation } from 'LaunchDarkly';
import queryString from 'query-string';
import { getDefaultHeaders } from 'core/services/usePlainCMAClient/getDefaultClientHeaders';
import { defaultTransformResponse, ResponseTransform } from 'data/responseTransform';
import { AuthParamsType } from 'data/CMA/types';

/**
 * @description
 * Create a HTTP request function that handles authentication and
 * retries.
 *
 * The two parameters are provided by the 'Authentication' module.
 *
 * See the wrapper documentation for details.
 */
type MakeRequestConfig = {
  auth: AuthParamsType;
  source?: string;
  clientName?: string;
  overrideDefaultResponseTransform?: ResponseTransform;
};

export type RequestConfig = {
  headers?: string;
  method: string;
  body?: unknown;
  url: string;
  query: Record<string, any>;
};

export type RequestFunc = (...args: any[]) => Promise<any>;
export type RetryFunc = (
  requestFunc: Function,
  version?: number,
  clientName?: string
) => RequestFunc;

let withRetry: RequestFunc;
let withRetryVersion = 1;
let currentSource;

const RETRY_VERSION: Record<number, RetryFunc> = {
  0: wrapWithRetry,
  1: wrapWithRetry,
  2: wrapWithRetryWithQueue,
};

export class PreflightRequestError extends Error {
  constructor() {
    super('Request failure in preflight');
  }
}

function getRetryVersion() {
  if (!hasCachedVariation(FLAGS.REQUEST_RETRY_EXPERIMENT)) {
    return 0;
  }
  const variation = getVariationSync(FLAGS.REQUEST_RETRY_EXPERIMENT);
  return variation ? 2 : 1;
}

/**
 * creates a request function.
 * @param {AuthParamsType} auth - authentication object.
 * @param {string} source - initiator id.
 * @param {string} clientName - tag for our different client implementations.
 * @param {ResponseTransform} overrideDefaultResponseTransform - override default response transform behaviour.
 */
export function makeRequest({
  auth,
  source,
  clientName,
  overrideDefaultResponseTransform,
}: MakeRequestConfig): RequestFunc {
  const version = getRetryVersion();

  if (version !== withRetryVersion || currentSource !== source || !withRetry) {
    withRetry = RETRY_VERSION[version](
      (config) =>
        fetchFn(config, source, overrideDefaultResponseTransform || defaultTransformResponse),
      version,
      clientName
    );
    withRetryVersion = version;
    currentSource = source;
  }

  return wrapWithCounter(wrapWithAuth(auth, withRetry), source, clientName);
}

async function fetchFn(
  config: RequestConfig,
  source?: string,
  responseTransform?: ResponseTransform
) {
  const args = buildRequestArguments(config, source);
  let rawResponse;
  try {
    rawResponse = await window.fetch(...args);
  } catch {
    throw new PreflightRequestError();
  }
  return responseTransform ? responseTransform(config, rawResponse) : rawResponse;
}

// fetch requires the url as the first argument.
// we require `body` to be a JSON string
// we also send a special X-Contentful-User-Agent header
function buildRequestArguments(data, source?: string): [string, RequestInit | undefined] {
  const url = withQuery(data.url, data.query);
  const requestData = {
    ...data,
    body: data.body ? JSON.stringify(data.body) : null,
    headers: {
      ...getDefaultHeaders(source),
      ...data.headers,
    },
  };

  return [url, requestData];
}

// convert request params to a query string and append it to the request url
function withQuery(url: string, query: any) {
  if (query) {
    // Our contract tests assert the queries as strings with keys in alphabetical order
    // Ideally our test should not care about the order
    const stringified = queryString.stringify(query, { arrayFormat: 'comma' });
    return `${url}?${stringified}`;
  }
  return url;
}

function wrapWithCounter(request: RequestFunc, source?: string, clientName?: string) {
  return async (args) => {
    Telemetry.count('cma-req', {
      endpoint: getEndpoint(args.url),
      state: getCurrentState(),
      version: withRetryVersion,
      source: source,
      client: clientName,
    });

    return request(args);
  };
}
