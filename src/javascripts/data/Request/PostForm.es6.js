import qs from 'qs';
import { assign } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $http = getModule('$http');

/**
 * @description
 * Post URL encoded form data to the given URL.
 *
 * @param {string} url
 * @param {object} data
 * @param {object?} config  Additional configuration passed to the
 *   `$http` request method
 * @returns {Promise<Response>}
 */
export default function postForm(url, data, config = {}) {
  config.method = 'POST';
  config.url = url;
  config.data = qs.stringify(data);
  const headers = assign({}, config.headers, {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  config.headers = headers;
  return $http(config);
}
