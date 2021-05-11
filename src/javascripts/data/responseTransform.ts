import { RequestConfig } from 'data/Request';
import { fromPairs } from 'lodash';
import createError from 'axios/lib/core/createError';

export type ResponseTransform = (config: RequestConfig, rawResponse: Response) => Promise<any>;

export const axiosTransformResponse = makeTransformResponse((config, response) => {
  return createError(
    'Request failed with status code ' + response.status,
    config,
    null,
    null,
    response
  );
});

export const defaultTransformResponse = makeTransformResponse((_, response) => {
  const asyncError = new Error('API request failed');
  return Object.assign(asyncError, {
    message: 'API request failed',
    ...response,
  });
});

type TransformError = (config: RequestConfig, response: any) => Error;

function makeTransformResponse(transformError: TransformError) {
  return async (config: RequestConfig, rawResponse: Response) => {
    const response = {
      config,
      data: null,
      headers: fromPairs([...rawResponse.headers.entries()]),
      status: rawResponse.status,
      statusText: rawResponse.statusText,
      rawResponse,
    };
    if (rawResponse.status !== 204) {
      try {
        response.data = await getResponseBody(rawResponse);
      } catch (err) {
        Object.assign(err, response);
        throw err;
      }
    }

    if (!rawResponse.ok) {
      throw transformError(config, response);
    }
    return response;
  };
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
