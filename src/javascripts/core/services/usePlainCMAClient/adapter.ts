import { RequestFunc } from 'data/Request';
import { captureError } from 'core/monitoring/error-tracking/capture';
import { AxiosRequestConfig } from 'axios';
import isAbsoluteURL from 'axios/lib/helpers/isAbsoluteURL';
import { isString } from 'lodash';

// axios adapter api: https://github.com/axios/axios/tree/master/lib/adapters
export function createAdapter(requestFunc: RequestFunc) {
  return async (config: AxiosRequestConfig) => {
    let body;

    if (config.data && isString(config.data)) {
      try {
        body = JSON.parse(config.data);
      } catch (error) {
        captureError(error);
      }
    }

    // axios provides absolute urls upon (internal) retries (which are disabled for now - but who knows)
    const absoluteUrl = isAbsoluteURL(config.url) ? config.url : `${config.baseURL}${config.url}`;

    return requestFunc({
      headers: config.headers,
      method: config.method?.toUpperCase(),
      body: body,
      url: absoluteUrl,
      query: config.params,
    });
  };
}
