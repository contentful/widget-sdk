import wrapWithRetry from 'data/Request/Retry';
import wrapWithRetryWithQueue from 'data/Request/RetryWithQueue';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import { FLAGS, getVariationSync, hasCachedVariation } from 'core/feature-flags';
import queryString from 'query-string';
import { getDefaultHeaders } from 'core/services/usePlainCMAClient/getDefaultClientHeaders';
import { defaultTransformResponse, ResponseTransform } from 'data/responseTransform';
import { AuthParamsType } from 'data/CMA/types';
import { Source } from 'i13n/constants';
import { SilentError } from '../core/monitoring';

/**
 * @description
 * Create a HTTP request function that handles authentication and
 * retries.
 *
 * The two parameters are provided by the 'Authentication' module.
 *
 * See the wrapper documentation for details.
 */
type ClientName = 'contentful-management' | 'endpoint' | 'legacy' | 'token';

type MakeRequestConfig = {
  auth: AuthParamsType;
  source?: Source;
  clientName?: ClientName;
  overrideDefaultResponseTransform?: ResponseTransform;
};

export type RequestConfig = {
  headers?: Record<string, string | number | boolean>;
  method: string;
  body?: unknown;
  url: string;
  query?: Record<string, any>;
};

type InternalRequestFunc = (
  config: RequestConfig,
  requestFunc: RequestFunc,
  clientName?: ClientName
) => Promise<any>;

export type RequestFunc = (config: RequestConfig) => Promise<any>;
export type RetryFunc = (version?: number) => InternalRequestFunc;

let withRetry: InternalRequestFunc;
let withRetryVersion = 1;

const RETRY_VERSION: Record<number, RetryFunc> = {
  0: wrapWithRetry,
  1: wrapWithRetry,
  2: wrapWithRetryWithQueue,
};

export class PreflightRequestError extends SilentError {
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

  if (version !== withRetryVersion || !withRetry) {
    withRetry = RETRY_VERSION[version](version);
    withRetryVersion = version;
  }

  const transformFunc = overrideDefaultResponseTransform || defaultTransformResponse;

  const retryFunc = async (config: RequestConfig) => {
    const func = (requestConfig) =>
      fetchFn({ config: requestConfig, source, responseTransform: transformFunc });
    return withRetry(config, func, clientName);
  };

  return wrapWithCounter(wrapWithAuth(auth, retryFunc), source, clientName);
}

async function fetchFn(args: {
  config: RequestConfig;
  responseTransform?: ResponseTransform;
  source?: Source;
}) {
  const requestData = buildRequestArguments(args.config, args.source);
  let rawResponse;
  try {
    rawResponse = await window.fetch(requestData.url, requestData.data);
  } catch {
    throw new PreflightRequestError();
  }
  if (args.responseTransform) {
    return args.responseTransform(args.config, rawResponse);
  } else {
    return rawResponse;
  }
}

type RequestArguments = {
  url: string;
  data?: RequestInit;
};

// fetch requires the url as the first argument.
// we require `body` to be a JSON string
// we also send a special X-Contentful-User-Agent header
function buildRequestArguments(config: RequestConfig, source?: string): RequestArguments {
  const url = withQuery(config.url, config.query);
  const requestData = {
    ...config,
    body: config.body ? JSON.stringify(config.body) : null,
    headers: {
      ...getDefaultHeaders(source),
      ...config.headers,
    },
  };

  return { url, data: requestData };
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
