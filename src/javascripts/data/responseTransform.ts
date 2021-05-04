import { RequestConfig } from 'data/Request';
import { fromPairs } from 'lodash';

export type ResponseTransform = (config: RequestConfig, rawResponse: Response) => Promise<any>;

export async function defaultTransformResponse(config: RequestConfig, rawResponse: Response) {
  const asyncError = new Error('API request failed');
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
 * @param  {Response} response window.fetch response
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
