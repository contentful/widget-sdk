import { stringify } from 'qs';
import { window } from 'core/services/window';

/**
 * @description
 * Post URL encoded form data to the given URL.
 *
 * @param {string} url
 * @param {object} data
 * @param {object?} config  Additional configuration
 * @returns {Promise<Response>}
 */
export default function postForm(url, data, config = {}) {
  const options = {
    ...config,
    method: 'POST',
    body: stringify(data),
    headers: {
      ...config?.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return window.fetch(url, options).then((res) => {
    if (!res.ok) {
      return Promise.reject(res);
    }

    return res.json();
  });
}
