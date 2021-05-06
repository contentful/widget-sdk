import { AuthParamsType } from 'data/CMA/types';
import { assign } from 'lodash';
import { RequestConfig, RequestFunc } from 'data/Request';

const UNAUTHORIZED = 401;

/**
 * @description
 * Wraps an HTTP request function so that it uses authentication
 *
 * When the wrapped request function is called we call `getToken()` to
 * obtain a token and call the underlying request function with the
 * 'Authorization: Bearer {TOKEN}' header.
 *
 * If the request fails with a 401 we call `refreshToken()` and retry
 * once with the new token.
 *
 * @param {object} auth - Authentication object exposing the two methods:
 *        {function(): Promise<string>} getToken,
 *        {function(): Promise<string>} refreshToken
 * @param {function(object): Promise} requestFn
 */
export default function wrapWithAuth(auth: AuthParamsType, requestFn: RequestFunc) {
  return (params) => {
    return auth.getToken().then((token) => {
      return requestWithToken(params, token, 1);
    });
  };

  function requestWithToken(params: RequestConfig, token: string, retry: number) {
    params.headers = assign({}, params.headers, {
      Authorization: `Bearer ${token}`,
    });
    return requestFn(params).catch((err) => {
      if (err.status === UNAUTHORIZED && retry > 0) {
        return ensureNewToken(token).then((token) => {
          return requestWithToken(params, token, retry - 1);
        });
      } else {
        return Promise.reject(err);
      }
    });
  }

  // Instead of retrying immediately we get the current token again in
  // case some other thread has refreshed it in the mean time.
  function ensureNewToken(oldToken: string) {
    return auth.getToken().then((newToken) => {
      if (newToken === oldToken) {
        return auth.refreshToken();
      } else {
        return newToken;
      }
    });
  }
}
