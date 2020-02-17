/**
 * Takes any string with query parameters and splits them into key values.
 * Duplicate parameters will be overwritten.
 *
 * @param {string} query - string with parameters
 */
export default function getQueryStringParams(query) {
  if (!query) {
    return {};
  }

  const queryParameters = /[?]/.test(query) ? query.split('?')[1] : query;
  return queryParameters.split('&').reduce((params, param) => {
    const [key, value] = param.split('=');
    params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
    return params;
  }, {});
}
